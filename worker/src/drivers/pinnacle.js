const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Pinnacle (XML Feed)
 */
async function pinnacleDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    const root = parsed.Pinnacle || parsed;
    const productKey = Object.keys(root).find(k => k.startsWith('PTH_'));
    const raw = productKey ? (Array.isArray(root[productKey]) ? root[productKey] : [root[productKey]]) : [];

    return raw.map(p => ({
        supplier_sku: p.StockCode ? String(p.StockCode) : 'UNKNOWN',
        supplier_name: supplier.name,
        name: String(p.ProdName || ''),
        description: String(p.ProdDesc || ''),
        brand: String(p.Brand || 'Pinnacle'),
        price_ex_vat: parseFloat(p.ProdPriceExclVAT || 0),
        qty_on_hand: parseInt(p.ProdQty || 0),
        image_url: String(p.ProdImg || ''),
        category: helpers.normalizeCategory(p.TopCat || p.category_tree, 'pinnacle'),
        master_sku: `${supplier.id}-${p.StockCode}`,
        raw_data: JSON.stringify(p)
    }));
}

module.exports = pinnacleDriver;
