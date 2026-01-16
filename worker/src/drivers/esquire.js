const { XMLParser } = require('fast-xml-parser');

/**
 * Driver for Esquire (XML Feed)
 */
async function esquireDriver(supplier, feedData, helpers) {
    const parser = new XMLParser();
    const parsed = parser.parse(feedData);
    
    let raw = [];
    
    // Esquire XML structures vary. Let's find the products list.
    if (parsed.ROOT?.products?.product) raw = parsed.ROOT.products.product;
    else if (parsed.products?.product) raw = parsed.products.product;
    else if (parsed.ROOT?.product) raw = parsed.ROOT.product;
    else if (parsed.product) raw = parsed.product;
    
    if (!Array.isArray(raw)) raw = raw ? [raw] : [];

    return raw.map(p => {
        let stockQty = 0;
        const available = p.AvailableQty || p.QtyAvailable || p.Stock || '';

        if (available !== undefined && available !== null) {
            // Handle Esquire's "Yes/No" availability format
            if (typeof available === 'string') {
                const qtyStr = available.toLowerCase().trim();
                if (['yes', 'y', 'true', 'available', 'in stock'].includes(qtyStr)) {
                    stockQty = 50; // Default reasonable stock for available items
                } else if (['no', 'n', 'false', '0', 'out of stock', 'unavailable'].includes(qtyStr)) {
                    stockQty = 0;
                } else {
                    // Try to extract number from string
                    const numMatch = qtyStr.match(/(\d+)/);
                    stockQty = numMatch ? parseInt(numMatch[1]) : 0;
                }
            } else {
                // Handle numeric values
                const directNum = parseFloat(available);
                stockQty = (!isNaN(directNum) && directNum >= 0) ? Math.floor(directNum) : 0;
            }
        }

        // Esquire Branch Stock (if available in this specific feed version)
        const jhb = parseInt(p.Stock_JHB || p.JHB_Stock || p.QtyJHB || 0);
        const cpt = parseInt(p.Stock_CPT || p.CPT_Stock || p.QtyCPT || 0);

        return {
            supplier_sku: String(p.ProductCode || p.SKU || p.code || 'UNKNOWN'),
            supplier_name: supplier.name,
            name: String(p.ProductName || p.Description || p.name || ''),
            description: String(p.ProductDescription || p.Description || ''),
            brand: String(p.Brand || p.Manufacturer || 'Esquire'),
            price_ex_vat: parseFloat(p.Price || p.DealerPrice || 0),
            qty_on_hand: stockQty || (jhb + cpt),
            stock_jhb: jhb,
            stock_cpt: cpt,
            image_url: String(p.image || p.ImageURL || ''),
            category: helpers.normalizeCategory(p.Category || p.TopCat, 'esquire'),
            master_sku: `${supplier.id}-${p.ProductCode || p.SKU}`,
            raw_data: JSON.stringify(p)
        };
    });
}

module.exports = esquireDriver;
