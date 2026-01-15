const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Syntech (XML Feed)
 */
async function syntechDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    let raw = [];
    if (parsed.syntechstock?.stock?.product) raw = parsed.syntechstock.stock.product;
    else if (parsed.stock?.product) raw = parsed.stock.product;
    if (!Array.isArray(raw)) raw = raw ? [raw] : [];

    return raw.map(p => {
        const stock = (parseInt(p.cptstock || p.cpt_stock || 0)) +
                    (parseInt(p.jhbstock || p.jhb_stock || 0)) +
                    (parseInt(p.dbnstock || p.dbn_stock || 0));
        return {
            supplier_sku: p.sku ? String(p.sku) : 'UNKNOWN',
            supplier_name: supplier.name,
            name: String(p.name || ''),
            description: String(p.description || ''),
            brand: String(p.attributes?.brand || p.brand || 'Syntech'),
            price_ex_vat: parseFloat(p.price || 0),
            qty_on_hand: stock,
            image_url: String(p.featured_image || p.image_url || ''),
            category: helpers.normalizeCategory(p.categories || p.category, 'syntech'),
            master_sku: `${supplier.id}-${p.sku}`,
            raw_data: JSON.stringify(p)
        };
    });
}

module.exports = syntechDriver;
