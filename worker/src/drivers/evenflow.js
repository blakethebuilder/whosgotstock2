/**
 * Driver for Evenflow (JSON API)
 */
async function evenflowDriver(supplier, feedData, helpers) {
    try {
        // Parse JSON response
        const jsonData = JSON.parse(feedData);

        // Handle different possible response structures
        let products = [];
        if (Array.isArray(jsonData)) {
            products = jsonData;
        } else if (jsonData.products && Array.isArray(jsonData.products)) {
            products = jsonData.products;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
            products = jsonData.data;
        } else {
            console.warn('Evenflow API: Unexpected JSON structure, expected array or {products: [...]} or {data: [...]}');
            return [];
        }

        return products
            .filter(p => p && (p.ef_code || p.itemCode || p.sku)) // Ensure product has identifier
            .map(p => ({
                supplier_sku: String(p.ef_code || p.itemCode || p.sku || '').trim().substring(0, 255),
                supplier_name: supplier.name,
                name: String(p.product_name || p.name || p.description || '').substring(0, 250),
                description: String(p.description || p.product_name || p.name || ''),
                brand: String(p.brand || p.manufacturer || 'Evenflow').substring(0, 100),
                price_ex_vat: parseFloat(p.standard_price || p.price || p.selling_price || 0),
                qty_on_hand: parseInt(p.qty_on_hand || p.quantity || p.stock || 0),
                stock_jhb: parseInt(p.stock_jhb || p.qty_jhb || 0),
                stock_cpt: parseInt(p.stock_cpt || p.qty_cpt || 0),
                image_url: String(p.image_url || p.image || ''),
                category: helpers.normalizeCategory(p.category || p.product_category, 'evenflow'),
                master_sku: `${supplier.id}-${p.ef_code || p.itemCode || p.sku}`.substring(0, 255),
                raw_data: JSON.stringify(p)
            }))
            .filter(p => p.price_ex_vat > 0 && p.supplier_sku); // Filter out invalid products
    } catch (error) {
        console.error('Evenflow API: Error parsing JSON response:', error.message);
        return [];
    }
}

module.exports = evenflowDriver;