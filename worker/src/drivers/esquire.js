const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Esquire (XML Feed)
 */
async function esquireDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    let raw = [];
    if (parsed.ROOT?.products?.product) raw = parsed.ROOT.products.product;
    else if (parsed.products?.product) raw = parsed.products.product;
    if (!Array.isArray(raw)) raw = raw ? [raw] : [];

    return raw.map(p => {
        let stockQty = 0;
        if (p.AvailableQty !== undefined && p.AvailableQty !== null) {
            const directNum = parseFloat(p.AvailableQty);
            if (!isNaN(directNum) && directNum >= 0) {
                stockQty = Math.floor(directNum);
            } else if (typeof p.AvailableQty === 'string') {
                const qtyStr = p.AvailableQty.toLowerCase().trim();
                if (['yes', 'y', 'true', '1'].includes(qtyStr)) stockQty = 1;
                else if (['no', 'n', 'false', '0'].includes(qtyStr)) stockQty = 0;
                else {
                    const numMatch = qtyStr.match(/(\d+)/);
                    stockQty = numMatch ? parseInt(numMatch[1]) : (qtyStr.includes('in stock') ? 1 : 0);
                }
            }
        }

        return {
            supplier_sku: p.ProductCode ? String(p.ProductCode) : 'UNKNOWN',
            supplier_name: supplier.name,
            name: String(p.ProductName || ''),
            description: String(p.ProductDescription || ''),
            brand: String(p.Brand || 'Esquire'),
            price_ex_vat: parseFloat(p.Price || 0),
            qty_on_hand: stockQty,
            image_url: String(p.image || ''),
            category: helpers.normalizeCategory(p.Category, 'esquire'),
            master_sku: `${supplier.id}-${p.ProductCode}`,
            raw_data: JSON.stringify(p)
        };
    });
}

module.exports = esquireDriver;
