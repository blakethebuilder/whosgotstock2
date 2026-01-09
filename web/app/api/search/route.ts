import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { normalizeSearchQuery, expandSearchTerms } from '@/lib/search-utils';
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
  
  // Input validation and sanitization - Enhanced for IT-focused search
  const rawQuery = searchParams.get('q')?.trim().slice(0, 200); // Increased for IT product names
  const suppliersParam = searchParams.get('suppliers'); // Comma-separated list
  const brand = searchParams.get('brand')?.trim().slice(0, 100);
  const categoriesParam = searchParams.get('categories'); // Comma-separated list
  const searchInDescription = searchParams.get('search_description') === 'true';
  
  // Validate numeric inputs
  const minPrice = parseFloat(searchParams.get('min_price') || '0') || 0;
  const maxPrice = parseFloat(searchParams.get('max_price') || '999999') || 999999;
  const page = Math.max(1, Math.min(100, parseInt(searchParams.get('page') || '1')));
  
  const inStock = searchParams.get('in_stock') === 'true';
  const sort = ['relevance', 'price_asc', 'price_desc', 'newest', 'name_asc', 'name_desc'].includes(searchParams.get('sort') || '') 
    ? searchParams.get('sort') 
    : 'relevance';
  
  const limit = 50;
  const offset = (page - 1) * limit;

  // Validate inputs
  if (minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
    return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
  }

  // Parse multi-select filters
  const suppliers = suppliersParam ? suppliersParam.split(',').filter(s => s.trim()).map(s => s.trim().toLowerCase()) : [];
  const categories = categoriesParam ? categoriesParam.split(',').filter(c => c.trim()).map(c => c.trim()) : [];

  // Create cache key
  const cacheKey = `search:${JSON.stringify({
    q: rawQuery, suppliers, brand, categories, minPrice, maxPrice, inStock, sort, page, searchInDescription
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

  // Enhanced query with ALL suppliers and product tables
  let sql = `
    SELECT 
      p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
      p.qty_on_hand, p.image_url, p.supplier_name, p.supplier_slug,
      p.last_updated, p.category, p.description
    FROM (
      -- Main products from XML feeds (Scoop, Esquire, Pinnacle, Mustek)
      SELECT 
        p.id, p.supplier_sku, p.name, p.brand, p.price_ex_vat, 
        p.qty_on_hand, p.image_url, s.name as supplier_name, s.slug as supplier_slug,
        p.last_updated, p.category, COALESCE(p.description, '') as description
      FROM products p
      JOIN suppliers s ON p.supplier_name = s.name
      WHERE s.enabled = true
      
      UNION ALL
      
      -- EvenFlow products
      SELECT 
        e.id + 100000 as id, e.ef_code as supplier_sku, e.product_name as name, 
        '' as brand, e.standard_price as price_ex_vat, 
        CASE WHEN e.standard_price > 0 THEN 999 ELSE 0 END as qty_on_hand, 
        '' as image_url, 'Even Flow' as supplier_name, 'evenflow' as supplier_slug,
        e.last_updated, e.category, COALESCE(e.description, '') as description
      FROM evenflow_products e
      WHERE e.standard_price > 0
      
      UNION ALL
      
      -- Linkqage products
      SELECT 
        l.id + 200000 as id, COALESCE(l.product_code, '') as supplier_sku, l.product_name as name,
        '' as brand, l.price as price_ex_vat,
        CASE WHEN l.in_stock THEN 999 ELSE 0 END as qty_on_hand,
        COALESCE(l.image_url, '') as image_url, 'Linkqage' as supplier_name, 'linkqage' as supplier_slug,
        l.last_updated, l.category, COALESCE(l.description, '') as description
      FROM linkqage_products l
      WHERE l.price > 0
      
      UNION ALL
      
      -- Manual supplier products (other suppliers)
      SELECT 
        m.id + 300000 as id, COALESCE(m.product_code, '') as supplier_sku, m.product_name as name,
        '' as brand, m.price as price_ex_vat,
        CASE WHEN m.in_stock THEN 999 ELSE 0 END as qty_on_hand,
        COALESCE(m.image_url, '') as image_url, m.supplier_name, 
        LOWER(REPLACE(REPLACE(m.supplier_name, ' ', '-'), '.', '')) as supplier_slug,
        m.last_updated, m.category, COALESCE(m.description, '') as description
      FROM manual_supplier_products m
      WHERE m.price > 0
    ) p
    WHERE 1=1
  `;

  // Enhanced Search Logic - IT-focused with description search
  if (rawQuery) {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const searchTerms = expandSearchTerms(normalizedQuery);
    
    // Build search conditions with expanded terms
    const searchConditions: string[] = [];
    searchTerms.forEach((term, idx) => {
      params.push(`%${term}%`);
      const paramNum = params.length;
      const conditions = [
        `p.name ILIKE $${paramNum}`,
        `p.brand ILIKE $${paramNum}`,
        `p.supplier_sku ILIKE $${paramNum}`
      ];
      
      // Include description if requested
      if (searchInDescription) {
        conditions.push(`p.description ILIKE $${paramNum}`);
      }
      
      searchConditions.push(`(${conditions.join(' OR ')})`);
    });
    
    whereConditions.push(`(${searchConditions.join(' OR ')})`);
  }

  // Multi-Supplier Filter
  if (suppliers.length > 0) {
    const supplierConditions: string[] = [];
    suppliers.forEach(supplier => {
      if (supplier === 'evenflow' || supplier === 'even-flow' || supplier === 'even flow') {
        supplierConditions.push(`p.supplier_slug = 'evenflow'`);
      } else if (supplier === 'linkqage') {
        supplierConditions.push(`p.supplier_slug = 'linkqage'`);
      } else {
        params.push(supplier);
        supplierConditions.push(`p.supplier_slug = $${params.length}`);
      }
    });
    if (supplierConditions.length > 0) {
      whereConditions.push(`(${supplierConditions.join(' OR ')})`);
    }
  }

  // Multi-Category Filter
  if (categories.length > 0) {
    const categoryConditions: string[] = [];
    categories.forEach(category => {
      params.push(`%${category}%`);
      categoryConditions.push(`p.category ILIKE $${params.length}`);
    });
    whereConditions.push(`(${categoryConditions.join(' OR ')})`);
  }

  // Brand Filter
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '').slice(0, 10);
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

  // Enhanced sorting options
  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price_ex_vat ASC, p.qty_on_hand DESC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price_ex_vat DESC, p.qty_on_hand DESC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY p.last_updated DESC, p.qty_on_hand DESC`;
  } else if (sort === 'name_asc') {
    sql += ` ORDER BY p.name ASC, p.price_ex_vat ASC`;
  } else if (sort === 'name_desc') {
    sql += ` ORDER BY p.name DESC, p.price_ex_vat ASC`;
  } else if (sort === 'relevance' && rawQuery) {
    // Enhanced relevance scoring
    const firstSearchTerm = rawQuery ? `%${normalizeSearchQuery(rawQuery)}%` : '';
    if (firstSearchTerm) {
      params.push(firstSearchTerm);
      sql += ` ORDER BY 
        CASE 
          WHEN p.name ILIKE $${params.length} THEN 1
          WHEN p.supplier_sku ILIKE $${params.length} THEN 2
          WHEN p.brand ILIKE $${params.length} THEN 3
          ELSE 4
        END,
        p.qty_on_hand DESC, 
        p.price_ex_vat ASC`;
    } else {
      sql += ` ORDER BY p.qty_on_hand DESC, p.price_ex_vat ASC`;
    }
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
      searchTerms: rawQuery ? expandSearchTerms(normalizeSearchQuery(rawQuery)) : [],
      filters: {
        suppliers: suppliers,
        categories: categories,
        brand: brand || null,
        priceRange: { min: minPrice, max: maxPrice },
        inStock,
        searchInDescription
      }
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