INSERT INTO products (
  master_sku, supplier_sku, supplier_name, name, description, brand,
  price_ex_vat, qty_on_hand, stock_jhb, stock_cpt, image_url, category, raw_data, last_updated
)
SELECT
  CONCAT('evenflow-', ef_code) as master_sku,
  ef_code as supplier_sku,
  'Even Flow' as supplier_name,
  product_name as name,
  COALESCE(description, product_name) as description,
  'Evenflow' as brand,
  COALESCE(standard_price, selling_price, 0) as price_ex_vat,
  CASE WHEN COALESCE(standard_price, selling_price, 0) > 0 THEN 100 ELSE 0 END as qty_on_hand,
  0 as stock_jhb, 0 as stock_cpt, '' as image_url,
  category, raw_data, last_updated
FROM evenflow_products
WHERE NOT EXISTS (
  SELECT 1 FROM products p WHERE p.supplier_name = 'Even Flow' AND p.supplier_sku = evenflow_products.ef_code
);
