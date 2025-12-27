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

  // Build unified query that combines both tables
  let unionSql = `
    (
      SELECT 
        p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
        p.qty_on_hand, p.category, p.description, p.image_url,
        s.name as supplier_name, s.slug as supplier_slug,
        'main' as source_table, p.last_updated
      FROM products p
      JOIN suppliers s ON p.supplier_name = s.name
      WHERE 1=1 {MAIN_CONDITIONS}
    )
    UNION ALL
    (
      SELECT 
        mp.id + 100000 as id, mp.ef_code as supplier_sku, mp.product_name as name, 
        'Even Flow' as brand, mp.standard_price as price_ex_vat,
        1 as qty_on_hand, mp.category, mp.description, 
        null as image_url, mp.supplier_name, 'evenflow' as supplier_slug,
        'manual' as source_table, mp.last_updated
      FROM manual_products mp
      WHERE 1=1 {MANUAL_CONDITIONS}
    )
  `;

  const params: any[] = [];
  let mainConditions = '';
  let manualConditions = '';

  // Enhanced Search Logic with synonyms and fuzzy matching
  if (rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const searchTerms = expandSearchTerms(normalizedQuery);
    
    // Create OR conditions for main products
    const mainSearchConditions = searchTerms.map((term) => {
      params.push(`%${term}%`);
      const paramIndex = params.length;
      return `(
        p.name ILIKE $${paramIndex} OR 
        p.brand ILIKE $${paramIndex} OR 
        p.supplier_sku ILIKE $${paramIndex} OR 
        p.category ILIKE $${paramIndex} OR
        p.description ILIKE $${paramIndex}
      )`;
    });
    
    // Create OR conditions for manual products
    const manualSearchConditions = searchTerms.map((term) => {
      params.push(`%${term}%`);
      const paramIndex = params.length;
      return `(
        mp.product_name ILIKE $${paramIndex} OR 
        mp.ef_code ILIKE $${paramIndex} OR 
        mp.category ILIKE $${paramIndex} OR
        mp.description ILIKE $${paramIndex}
      )`;
    });
    
    mainConditions += ` AND (${mainSearchConditions.join(' OR ')})`;
    manualConditions += ` AND (${manualSearchConditions.join(' OR ')})`;
  }

  // Supplier Filter
  if (supplier) {
    if (supplier === 'evenflow') {
      // Only show manual products
      mainConditions += ` AND 1=0`; // Exclude main products
    } else {
      params.push(supplier);
      mainConditions += ` AND s.slug = $${params.length}`;
      manualConditions += ` AND 1=0`; // Exclude manual products
    }
  }

  // Brand Filter
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '');
    if (brands.length > 0) {
      const mainBrandConditions = brands.map(b => {
        params.push(`%${b.trim()}%`);
        return `p.brand ILIKE $${params.length}`;
      });
      mainConditions += ` AND (${mainBrandConditions.join(' OR ')})`;
      
      // For manual products, only Even Flow brand
      if (!brands.some(b => b.toLowerCase().includes('even') || b.toLowerCase().includes('flow'))) {
        manualConditions += ` AND 1=0`; // Exclude manual products if brand doesn't match
      }
    }
  }

  // Category Filter
  if (category) {
    const categories = category.split(',').filter(c => c.trim() !== '');
    if (categories.length > 0) {
      const mainCategoryConditions = categories.map(c => {
        params.push(`%${c.trim()}%`);
        return `p.category ILIKE $${params.length}`;
      });
      const manualCategoryConditions = categories.map(c => {
        params.push(`%${c.trim()}%`);
        return `mp.category ILIKE $${params.length}`;
      });
      mainConditions += ` AND (${mainCategoryConditions.join(' OR ')})`;
      manualConditions += ` AND (${manualCategoryConditions.join(' OR ')})`;
    }
  }

  // Price Filter
  if (minPrice) {
    params.push(parseFloat(minPrice));
    const paramIndex = params.length;
    mainConditions += ` AND p.price_ex_vat >= $${paramIndex}`;
    manualConditions += ` AND mp.standard_price >= $${paramIndex}`;
  }
  if (maxPrice) {
    params.push(parseFloat(maxPrice));
    const paramIndex = params.length;
    mainConditions += ` AND p.price_ex_vat <= $${paramIndex}`;
    manualConditions += ` AND mp.standard_price <= $${paramIndex}`;
  }

  // Stock Filter (manual products always considered in stock)
  if (inStock === 'true') {
    mainConditions += ` AND p.qty_on_hand > 0`;
    // Manual products are always "in stock" so no additional condition needed
  }

  // Replace placeholders
  const finalSql = unionSql
    .replace('{MAIN_CONDITIONS}', mainConditions)
    .replace('{MANUAL_CONDITIONS}', manualConditions);

  // Count Query
  const countSql = `SELECT COUNT(*) FROM (${finalSql}) as total`;

  // Add sorting and pagination
  let sortedSql = `SELECT * FROM (${finalSql}) as combined`;
  
  if (sort === 'price_asc') {
    sortedSql += ` ORDER BY price_ex_vat ASC`;
  } else if (sort === 'price_desc') {
    sortedSql += ` ORDER BY price_ex_vat DESC`;
  } else if (sort === 'newest') {
    sortedSql += ` ORDER BY last_updated DESC`;
  } else if (sort === 'relevance' && rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    sortedSql += ` ORDER BY 
      CASE 
        WHEN name ILIKE '%${normalizedQuery}%' THEN 1
        WHEN brand ILIKE '%${normalizedQuery}%' THEN 2
        WHEN category ILIKE '%${normalizedQuery}%' THEN 3
        ELSE 4
      END,
      qty_on_hand DESC, 
      price_ex_vat ASC`;
  } else {
    // Default sort: in stock first, then by price
    sortedSql += ` ORDER BY qty_on_hand DESC, price_ex_vat ASC`;
  }

  sortedSql += ` LIMIT ${limit} OFFSET ${offset}`;

  try {
    const client = await pool.connect();
    const [countRes, dataRes] = await Promise.all([
      client.query(countSql, params),
      client.query(sortedSql, params)
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