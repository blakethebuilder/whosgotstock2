import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizeSearchQuery, expandQueryToGroups, expandSearchTerms } from '@/lib/search-utils';
import { getCached, setCache } from '@/lib/cache';
import { searchRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResult = searchRateLimit(request as any);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.reset },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );
  }

  const { searchParams } = new URL(request.url);
  
  const rawQuery = searchParams.get('q')?.trim().slice(0, 200) || '';
  const suppliersParam = searchParams.get('suppliers');
  const brand = searchParams.get('brand')?.trim().slice(0, 100);
  const categoriesParam = searchParams.get('categories');
  const searchInDescription = searchParams.get('search_description') === 'true';
  
  const minPrice = parseFloat(searchParams.get('min_price') || '0') || 0;
  const maxPrice = parseFloat(searchParams.get('max_price') || '999999') || 999999;
  const page = Math.max(1, Math.min(100, parseInt(searchParams.get('page') || '1')));
  
  const inStock = searchParams.get('in_stock') === 'true';
  const sort = ['relevance', 'price_asc', 'price_desc', 'newest', 'name_asc', 'name_desc'].includes(searchParams.get('sort') || '') 
    ? searchParams.get('sort') 
    : 'relevance';
  
  const limit = 50;
  const offset = (page - 1) * limit;

  if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
    return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
  }

  const suppliers = suppliersParam ? suppliersParam.split(',').filter(s => s.trim()).map(s => s.trim().toLowerCase()) : [];
  const categories = categoriesParam ? categoriesParam.split(',').filter(c => c.trim()).map(c => c.trim()) : [];

  const cacheKey = `search:${JSON.stringify({
    q: rawQuery, suppliers, brand, categories, minPrice, maxPrice, inStock, sort, page, searchInDescription
  })}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const params: any[] = [];
  const whereConditions: string[] = [];

  // Base Query
  let sqlBase = `
    FROM products p
    JOIN suppliers s ON p.supplier_name = s.name
    WHERE s.enabled = true
  `;

  // Search Logic
  if (rawQuery) {
    const termGroups = expandQueryToGroups(rawQuery);
    termGroups.forEach(group => {
      const groupConditions: string[] = [];
      group.forEach(term => {
        params.push(`%${term}%`);
        const pNum = params.length;
        let cond = `(p.name ILIKE $${pNum} OR p.supplier_sku ILIKE $${pNum} OR p.brand ILIKE $${pNum}`;
        if (searchInDescription) cond += ` OR p.description ILIKE $${pNum}`;
        cond += `)`;
        groupConditions.push(cond);
      });
      whereConditions.push(`(${groupConditions.join(' OR ')})`);
    });
  }

  if (suppliers.length > 0) {
    const supplierConditions: string[] = [];
    suppliers.forEach(supplier => {
        params.push(supplier);
        supplierConditions.push(`s.slug = $${params.length}`);
    });
    whereConditions.push(`(${supplierConditions.join(' OR ')})`);
  }

  if (categories.length > 0) {
    const categoryConditions: string[] = [];
    categories.forEach(category => {
      params.push(`%${category}%`);
      categoryConditions.push(`p.category ILIKE $${params.length}`);
    });
    whereConditions.push(`(${categoryConditions.join(' OR ')})`);
  }

  if (brand) {
    params.push(`%${brand}%`);
    whereConditions.push(`p.brand ILIKE $${params.length}`);
  }

  if (minPrice > 0) {
    params.push(minPrice);
    whereConditions.push(`p.price_ex_vat >= $${params.length}`);
  }
  if (maxPrice < 999999) {
    params.push(maxPrice);
    whereConditions.push(`p.price_ex_vat <= $${params.length}`);
  }

  if (inStock) {
    whereConditions.push(`p.qty_on_hand > 0`);
  }

  if (whereConditions.length > 0) {
    sqlBase += ` AND ${whereConditions.join(' AND ')}`;
  }

  // Final SQL with Columns
  let sql = `
    SELECT 
      p.id::text, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
      p.qty_on_hand, p.stock_jhb, p.stock_cpt, p.image_url, p.supplier_name, s.slug as supplier_slug,
      p.last_updated, p.category, COALESCE(p.description, '') as description
    ${sqlBase}
  `;

  // Sorting
  if (sort === 'price_asc') sql += ` ORDER BY p.price_ex_vat ASC`;
  else if (sort === 'price_desc') sql += ` ORDER BY p.price_ex_vat DESC`;
  else if (sort === 'newest') sql += ` ORDER BY p.last_updated DESC`;
  else sql += ` ORDER BY p.qty_on_hand DESC, p.price_ex_vat ASC`;

  // Pagination
  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const countSql = `SELECT COUNT(*) ${sqlBase}`;

  let client;
  try {
    client = await pool.connect();
    const countParams = params.slice(0, params.length - 2);
    const [countRes, dataRes] = await Promise.all([
      client.query(countSql, countParams),
      client.query(sql, params)
    ]);

    const result = {
      results: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit
    };

    setCache(cacheKey, result, 120000);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json({ error: 'Search failed', details: err.message, results: [], total: 0 }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
