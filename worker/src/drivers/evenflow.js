const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Even Flow (JSON/XML)
 */
async function evenflowDriver(supplier, feedData, helpers) {
    let raw = [];
    try {
        const parsedJson = JSON.parse(feedData);
        raw = Array.isArray(parsedJson) ? parsedJson : (parsedJson.products || []);
    } catch (e) {
        const parser = new XMLParser();
        const parsedXml = parser.parse(feedData);
        raw = parsedXml.products?.product || [];
        if (!Array.isArray(raw)) raw = raw ? [raw] : [];
    }

    return raw.map(p => ({
        supplier_sku: String(p.sku || p.code || p.ef_code || 'UNKNOWN').trim(),
        supplier_name: supplier.name,
        name: String(p.name || p.product_name || p.description || ''),
        description: String(p.description || ''),
        brand: String(p.brand || 'Even Flow'),
        price_ex_vat: parseFloat(p.price || p.standard_price || 0),
        qty_on_hand: parseInt(p.qty || p.stock || p.quantity || 0),
        image_url: String(p.image || p.image_url || ''),
        category: helpers.normalizeCategory(p.category || p.sheet_name, 'evenflow'),
        master_sku: `${supplier.id}-${p.sku || p.code || p.ef_code}`,
        raw_data: JSON.stringify(p)
    }));
}

module.exports = evenflowDriver;
