/**
 * Driver for Mustek (CSV Feed)
 */
async function mustekDriver(supplier, feedData, helpers) {
    const csvData = helpers.parseCSV(feedData);
    
    return csvData
        .filter(p => p.Status === 'Active')
        .map(p => ({
            supplier_sku: p.ItemId ? String(p.ItemId).trim().substring(0, 255) : 'UNKNOWN',
            supplier_name: supplier.name,
            name: (p.Description || '').substring(0, 250),
            description: p.Description || '',
            brand: (p.ProductLine || 'Mustek').substring(0, 100),
            price_ex_vat: parseFloat(p.Price || 0),
            qty_on_hand: parseInt(p.QtyAvailable || 0),
            stock_jhb: parseInt(p.QtyJhb || 0),
            stock_cpt: parseInt(p.QtyCpt || 0),
            image_url: p['Primary Image'] || p.Thumbnail || '',
            category: helpers.normalizeCategory(p.ProductLine, supplier.id),
            master_sku: `${supplier.id}-${p.ItemId}`.substring(0, 255),
            raw_data: JSON.stringify(p)
        }));
}

module.exports = mustekDriver;
