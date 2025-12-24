import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const supplier = searchParams.get('supplier');

  // New Filters
  const brand = searchParams.get('brand');
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const inStock = searchParams.get('in_stock');
  const sort = searchParams.get('sort'); // price_asc, price_desc, newest
  const category = searchParams.get('category');

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT p.*, s.name as supplier_name 
    FROM products p
    JOIN suppliers s ON p.supplier_name = s.name
    WHERE 1=1
  `;
  const params: any[] = [];

  // Search Logic (Fuzzy)
  if (query) {
    params.push(`%${query}%`);
    sql += ` AND (p.name ILIKE $${params.length} OR p.brand ILIKE $${params.length} OR p.supplier_sku ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
  }

  // Supplier Filter
  if (supplier) {
    params.push(supplier);
    sql += ` AND s.slug = $${params.length}`;
  }

  // Brand Filter
  if (brand) {
    const brands = brand.split(',').filter(b => b.trim() !== '');
    if (brands.length > 0) {
      params.push(brands);
      sql += ` AND p.brand = ANY($${params.length})`;
    }
  }

  // Category Filter
  if (category) {
    const categories = category.split(',').filter(c => c.trim() !== '');
    if (categories.length > 0) {
      params.push(categories);
      sql += ` AND p.category = ANY($${params.length})`;
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

  // Sorting
  if (sort === 'price_asc') {
    sql += ` ORDER BY p.price_ex_vat ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY p.price_ex_vat DESC`;
  } else if (sort === 'newest') {
    sql += ` ORDER BY p.last_updated DESC`;
  } else {
    // Default sort
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

    return NextResponse.json({
      results: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page,
      limit
    });
  } catch (err: any) {
    console.warn('Database query failed, falling back to local file:', err);
    // Fallback: Read from web/data/products.json
    try {
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      const fileData = await fs.promises.readFile(filePath, 'utf-8');
      const allProducts = JSON.parse(fileData);

      const qLower = (query || '').toLowerCase();
      const filtered = allProducts.filter((p: any) => {
        const matchName = p.name?.toLowerCase().includes(qLower);
        const matchBrand = p.brand?.toLowerCase().includes(qLower);
        const matchSku = p.supplier_sku?.toLowerCase().includes(qLower);
        const matchSupplier = supplier ? p.supplier_name?.toLowerCase() === supplier.toLowerCase() : true;

        return (matchName || matchBrand || matchSku) && matchSupplier;
      });

      return NextResponse.json({ results: filtered.slice(0, 50) });
    } catch (fileErr) {
      return NextResponse.json({ error: 'Database and file fallback failed' }, { status: 500 });
    }
  }
}
