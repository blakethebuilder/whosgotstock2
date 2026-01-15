const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Scoop (XML Feed)
 */
async function scoopDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    const raw = Array.isArray(parsed.products?.product)
        ? parsed.products.product
        : (parsed.products?.product ? [parsed.products.product] : []);

    return raw.map(p => ({
        supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
        supplier_name: supplier.name,
        name: String(p.description || ''),
        description: String(p.description || ''),
        brand: String(p.manufacturer || ''),
        price_ex_vat: parseFloat(p.dealer_price || 0),
        qty_on_hand: parseInt(p.total_stock || 0),
        image_url: String(p.image_url || ''),
        category: helpers.normalizeCategory('Networking', 'scoop'),
        master_sku: `${supplier.id}-${p.sku}`,
        raw_data: JSON.stringify(p)
    }));
}

module.exports = scoopDriver;
