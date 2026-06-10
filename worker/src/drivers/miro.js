const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Miro (XML RSS Feed)
 */
async function miroDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    const raw = Array.isArray(parsed.rss?.channel?.item)
        ? parsed.rss.channel.item
        : (parsed.rss?.channel?.item ? [parsed.rss.channel.item] : []);

    return raw.map(p => {
        const sku = p._sku ? String(p._sku).trim() : 'UNKNOWN';
        return {
            supplier_sku: sku,
            supplier_name: supplier.name,
            name: String(p.title || ''),
            description: String(p.d_miro_subtitle || p.description || ''),
            brand: String(p.brand || ''),
            price_ex_vat: parseFloat(p._price || 0),
            qty_on_hand: parseInt(p.stock_quantities || 0),
            stock_jhb: parseInt(p.stock_jhb || 0),
            stock_cpt: parseInt(p.stock_cpt || 0),
            image_url: String(p.featured_image || ''),
            category: helpers.normalizeCategory(p.category || 'Networking', 'miro'),
            master_sku: `${supplier.id}-${sku}`,
            raw_data: JSON.stringify(p)
        };
    });
}

module.exports = miroDriver;
