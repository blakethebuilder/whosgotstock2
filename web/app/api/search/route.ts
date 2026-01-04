import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizeSearchQuery } from '@/lib/search-utils';
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
  
  // Input validation and sanitization
  const rawQuery = searchParams.get('q')?.trim().slice(0, 100); // Limit query length
  const supplier = searchParams.get('supplier')?.trim().slice(0, 50);
  const brand = searchParams.get('brand')?.trim().slice(0, 100);
  const category = searchParams.get('category')?.trim().slice(0, 100);
  
  // Validate numeric inputs
  const minPrice = parseFloat(searchParams.get('min_price') || '0') || 0;
  const maxPrice = parseFloat(searchParams.get('max_price') || '999999') || 999999;
  const page = Math.max(1, Math.min(100, parseInt(searchParams.get('page') || '1'))); // Limit page range
  
  const inStock = searchParams.get('in_stock') === 'true';
  const sort = ['relevance', 'price_asc', 'price_desc', 'newest'].includes(searchParams.get('sort') || '') 
    ? searchParams.get('sort') 
    : 'relevance';
  
  const limit = 50;
  const offset = (page - 1) * limit;

  // Validate inputs
  if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
    return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
  }

  // Create cache key
  const cacheKey = `search:${JSON.stringify({
    q: rawQuery, supplier, brand, category, minPrice, maxPrice, inStock, sort, page
  })}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    });
  }

  // Build parameterized queries to prevent SQL injection
  const params: any[] = [];
  let whereConditions: string[] = [];

  // Enhanced query with proper parameterization
  let sql = `
    SELECT 
      p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
      p.qty_on_hand, p.image_url, p.supplier_name, p.supplier_slug,
      p.last_updated, p.category, p.description
    FROM (
      -- Main products
      SELECT 
        p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
        p.qty_on_hand, p.image_url, s.name as supplier_name, s.slug as supplier_slug,
        p.last_updated, p.category, p.description
      FROM products p
      JOIN suppliers s ON p.supplier_name = s.name
      
      UNION ALL
      
      -- EvenFlow products
      SELECT 
        e.id + 100000 as id, e.ef_code as supplier_sku, e.product_name as name, 
        '' as brand, e.standard_price as price_ex_vat, 
        999 as qty_on_hand, '' as image_url, 'Even Flow' as supplier_name, 'evenflow' as supplier_slug,
        e.last_updated, e.category, e.description
      FROM evenflow_products e
      WHERE e.standard_price > 0
    ) p
    WHERE 1=1
  `;

  // Search Logic
  if (rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    params.push(`%${normalizedQuery}%`);
    whereConditions.push(`(
      p.name ILIKE $${params.length} OR 
      p.brand ILIKE $${params.length} OR 
      p.supplier_sku ILIKE $${params.length}
    )`);
  }

  // Supplier Filter
  if (supplier) {
    if (supplier === 'evenflow' || supplier === 'even-flow' || supplier === 'Even Flow') {
      whereConditions.push(`p.supplier_name = 'Even Flow'`);
    } else {
      params.push(supplier);
      whereConditions.push(`p.supplier_slug = $${params.length}`);
    }
  }

  // Brand Filter
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '').slice(0, 10); // Limit brands
    if (brands.length > 0) {
      const brandConditions = brands.map(b => {
        params.push(`%${b.trim()}%`);
        return `p.brand ILIKE $${params.length}`;
      });
      whereConditions.push(`(${brandConditions.join(' OR ')})`);
    }
  }

  // Price Filter
  if (minPrice > 0) {
    params.push(minPrice);
    whereConditions.push(`p.price_ex_vat >= $${params.length}`);
  }
  if (maxPrice < 999999) {
    params.push(maxPrice);
    whereConditions.push(`p.price_ex_vat <= $${params.length}`);
  }

  // Stock Filter
  if (inStock) {
    whereConditions.push(`p.qty_on_hand > 0`);
  }

  // Add all conditions to SQL
  if (whereConditions.length > 0) {
    sql += ` AND ${whereConditions.join(' AND ')}`;
  }

  // Count Query
  const countSql = `SELECT COUNT(*) FROM (${sql}) as total`;

  // Add sorting
  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price_ex_vat ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price_ex_vat DESC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY p.last_updated DESC`;
  } else if (sort === 'relevance' && rawQuery) {
    sql += ` ORDER BY 
      CASE 
        WHEN p.name ILIKE $1 THEN 1
        WHEN p.brand ILIKE $1 THEN 2
        ELSE 3
      END,
      p.qty_on_hand DESC, 
      p.price_ex_vat ASC`;
  } else {
    // Default sort: in stock first, then by price
    sql += ` ORDER BY p.qty_on_hand DESC, p.price_ex_vat ASC`;
  }

  // Add pagination
  params.push(limit, offset);
  sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

  let client;
  try {
    client = await pool.connect();
    
    // Use Promise.all for concurrent queries
    const [countRes, dataRes] = await Promise.all([
      client.query(countSql, params.slice(0, -2)), // Count query without pagination
      client.query(sql, params) // Main query with pagination
    ]);

    const result = {
      results: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit,
      searchTerms: rawQuery ? [rawQuery] : []
    };

    // Cache for 2 minutes
    setCache(cacheKey, result, 120000);

    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    });
  } catch (err: any) {
    console.error('Search API error:', err);
    return NextResponse.json({ 
      error: 'Search failed', 
      results: [], 
      total: 0
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}