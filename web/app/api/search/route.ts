import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { expandSearchTerms, normalizeSearchQuery } from '@/lib/search-utils';
import { getCached, setCache } from '@/lib/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q');
  const supplier = searchParams.get('supplier');
  const brand = searchParams.get('brand');
  const category = searchParams.get('category');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const inStock = searchParams.get('in_stock');
  const sort = searchParams.get('sort');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Create cache key
  const cacheKey = `search:${JSON.stringify(Object.fromEntries(searchParams))}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Simple query for main products only (for now)
  let sql = `
    SELECT 
      p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
      p.qty_on_hand, p.image_url,
      s.name as supplier_name, s.slug as supplier_slug,
      p.last_updated
    FROM products p
    JOIN suppliers s ON p.supplier_name = s.name
    WHERE 1=1
  `;

  const params: any[] = [];
  let conditions = '';

  // Enhanced Search Logic with synonyms and fuzzy matching
  if (rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const searchTerms = expandSearchTerms(normalizedQuery);
    
    // Create OR conditions for main products
    const searchConditions = searchTerms.map((term) => {
      params.push(`%${term}%`);
      const paramIndex = params.length;
      return `(
        p.name ILIKE $${paramIndex} OR 
        p.brand ILIKE $${paramIndex} OR 
        p.supplier_sku ILIKE $${paramIndex}
      )`;
    });
    
    conditions += ` AND (${searchConditions.join(' OR ')})`;
  }

  // Supplier Filter
  if (supplier && supplier !== 'evenflow') {
    params.push(supplier);
    conditions += ` AND s.slug = $${params.length}`;
  }

  // Brand Filter
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '');
    if (brands.length > 0) {
      const brandConditions = brands.map(b => {
        params.push(`%${b.trim()}%`);
        return `p.brand ILIKE $${params.length}`;
      });
      conditions += ` AND (${brandConditions.join(' OR ')})`;
    }
  }

  // Category Filter - skip for now since category column may not exist
  // if (category) {
  //   const categories = category.split(',').filter(c => c.trim() !== '');
  //   if (categories.length > 0) {
  //     const categoryConditions = categories.map(c => {
  //       params.push(`%${c.trim()}%`);
  //       return `p.category ILIKE $${params.length}`;
  //     });
  //     conditions += ` AND (${categoryConditions.join(' OR ')})`;
  //   }
  // }

  // Price Filter
  if (minPrice) {
    params.push(parseFloat(minPrice));
    conditions += ` AND p.price_ex_vat >= $${params.length}`;
  }
  if (maxPrice) {
    params.push(parseFloat(maxPrice));
    conditions += ` AND p.price_ex_vat <= $${params.length}`;
  }

  // Stock Filter
  if (inStock === 'true') {
    conditions += ` AND p.qty_on_hand > 0`;
  }

  // Add conditions to SQL
  sql += conditions;

  // Count Query
  const countSql = `SELECT COUNT(*) FROM (${sql}) as total`;

  // Add sorting and pagination
  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price_ex_vat ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price_ex_vat DESC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY p.last_updated DESC`;
  } else if (sort === 'relevance' && rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    sql += ` ORDER BY 
      CASE 
        WHEN p.name ILIKE '%${normalizedQuery}%' THEN 1
        WHEN p.brand ILIKE '%${normalizedQuery}%' THEN 2
        ELSE 3
      END,
      p.qty_on_hand DESC, 
      p.price_ex_vat ASC`;
  } else {
    // Default sort: in stock first, then by price
    sql += ` ORDER BY p.qty_on_hand DESC, p.price_ex_vat ASC`;
  }

  sql += ` LIMIT ${limit} OFFSET ${offset}`;

  try {
    const client = await pool.connect();
    const [countRes, dataRes] = await Promise.all([
      client.query(countSql, params),
      client.query(sql, params)
    ]);
    client.release();

    const result = {
      results: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
      searchTerms: rawQuery ? expandSearchTerms(normalizeSearchQuery(rawQuery)) : []
    };

    // Cache for 2 minutes
    setCache(cacheKey, result, 120000);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json({ 
      error: 'Search failed', 
      results: [], 
      total: 0
    }, { status: 500 });
  }
}