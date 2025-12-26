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

  let sql = `
    SELECT p.*, s.name as supplier_name 
    FROM products p
    JOIN suppliers s ON p.supplier_name = s.name
    WHERE 1=1
  `;
  const params: any[] = [];

  // Enhanced Search Logic with synonyms and fuzzy matching
  if (rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const searchTerms = expandSearchTerms(normalizedQuery);
    
    // Create OR conditions for all search terms
    const searchConditions = searchTerms.map((term, index) => {
      params.push(`%${term}%`);
      return `(
        p.name ILIKE $${params.length} OR 
        p.brand ILIKE $${params.length} OR 
        p.supplier_sku ILIKE $${params.length} OR 
        p.category ILIKE $${params.length} OR
        p.description ILIKE $${params.length}
      )`;
    });
    
    sql += ` AND (${searchConditions.join(' OR ')})`;
  }

  // Supplier Filter
  if (supplier) {
    params.push(supplier);
    sql += ` AND s.slug = $${params.length}`;
  }

  // Brand Filter - Support multiple brands
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '');
    if (brands.length > 0) {
      const brandConditions = brands.map(b => {
        params.push(`%${b.trim()}%`);
        return `p.brand ILIKE $${params.length}`;
      });
      sql += ` AND (${brandConditions.join(' OR ')})`;
    }
  }

  // Category Filter - Support multiple categories
  if (category) {
    const categories = category.split(',').filter(c => c.trim() !== '');
    if (categories.length > 0) {
      const categoryConditions = categories.map(c => {
        params.push(`%${c.trim()}%`);
        return `p.category ILIKE $${params.length}`;
      });
      sql += ` AND (${categoryConditions.join(' OR ')})`;
    }
  }

  // Price Filter
  if (minPrice) {
    params.push(parseFloat(minPrice));
    sql += ` AND p.price_ex_vat >= $${params.length}`;
  }
  if (maxPrice) {
    params.push(parseFloat(maxPrice));
    sql += ` AND p.price_ex_vat <= $${params.length}`;
  }

  // Stock Filter
  if (inStock === 'true') {
    sql += ` AND p.qty_on_hand > 0`;
  }

  // Count Query (before sorting and pagination)
  const countSql = `SELECT COUNT(*) FROM (${sql}) as total`;

  // Enhanced Sorting with relevance scoring
  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price_ex_vat ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price_ex_vat DESC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY p.last_updated DESC`;
  } else if (sort === 'relevance' && rawQuery) {
    // Relevance scoring: exact matches first, then partial matches
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    sql += ` ORDER BY 
      CASE 
        WHEN p.name ILIKE '%${normalizedQuery}%' THEN 1
        WHEN p.brand ILIKE '%${normalizedQuery}%' THEN 2
        WHEN p.category ILIKE '%${normalizedQuery}%' THEN 3
        ELSE 4
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