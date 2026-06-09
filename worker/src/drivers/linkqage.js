const axios = require('axios');

/**
 * Driver for Linkqage (FTGDrop JSON Feed API with pagination)
 */
async function linkqageDriver(supplier, feedData, helpers) {
    try {
        console.log(`Linkqage: Driver started for supplier: ${supplier.name}`);

        let baseUrl = supplier.url;
        // Check if token is already in the URL (ends with a alphanumeric token of length 50+)
        const tokenRegex = /\/feed\/([a-zA-Z0-9]{50,})/;
        const match = baseUrl.match(tokenRegex);
        
        let token = '';
        if (match) {
            token = match[1];
        } else {
            token = (process.env.LINKQAGE_TOKEN || 'TiZBRxFPIDTM28VhKmQAToLYSDUmkflX9DpOVYJrn6xuOiNTZpv1KgviF2iPP7uT').trim();
            baseUrl = baseUrl.endsWith('/') ? baseUrl + token : baseUrl + '/' + token;
        }

        console.log(`Linkqage: Using API base: ${baseUrl.replace(token, '***')}`);

        const allProducts = [];
        let page = 1;
        let totalPages = 1;
        const perPage = 250; // Fetch in larger chunks for efficiency

        do {
            console.log(`Linkqage: Fetching page ${page} of ${totalPages}...`);
            
            try {
                const response = await axios.get(baseUrl, {
                    params: {
                        per_page: perPage,
                        page: page
                    },
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'WhosGotStockBot/1.0'
                    },
                    timeout: 45000
                });

                const body = response.data;
                if (!body || !body.data) {
                    console.error('Linkqage: Invalid response structure received:', body);
                    break;
                }

                const items = body.data;
                if (!Array.isArray(items) || items.length === 0) {
                    console.log('Linkqage: No more products returned in page data.');
                    break;
                }

                allProducts.push(...items);
                
                // Read pagination data from envelope
                totalPages = parseInt(body.pages) || 1;
                console.log(`Linkqage: Retrieved ${items.length} items from page ${page}. Total harvested: ${allProducts.length}`);
                
                page++;
                
                // Safety exit to prevent runaway loops in development
                if (page > 100) {
                    console.warn('Linkqage: Safety page limit reached (100 pages cap)');
                    break;
                }

                // Brief pause to respect API rate limits
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (pageErr) {
                console.error(`Linkqage: Error fetching page ${page}:`, pageErr.message);
                break;
            }
        } while (page <= totalPages);

        console.log(`Linkqage: Successfully downloaded ${allProducts.length} items. Mapping to internal schema...`);

        const mappedProducts = [];
        let skippedCount = 0;

        for (const p of allProducts) {
            if (!p || !p.attributes) continue;

            try {
                const attrs = p.attributes || {};
                const code = attrs.code || String(p.id);

                // Extract description: prioritize long, fallback to medium, short, or name
                const description = attrs.descriptions?.long || 
                                    attrs.descriptions?.medium || 
                                    attrs.descriptions?.short || 
                                    attrs.name || '';

                // Extract brand name, default to Linkqage
                const brand = attrs.brand?.name || 'Linkqage';

                // Find Dealer Price (ex VAT) in pricelists
                const dealerPricelist = attrs.pricing?.pricelists?.find(
                    pl => pl.slug === 'dealer-price' || (pl.name && pl.name.toLowerCase().includes('dealer'))
                );
                
                // If dealer-price is missing, try fallback to retail price or first available
                const chosenPricelist = dealerPricelist || (attrs.pricing?.pricelists && attrs.pricing.pricelists[0]);
                const priceExVat = chosenPricelist ? parseFloat(chosenPricelist.final_selling) : 0;

                // Extract Cape Town (CPT) and Johannesburg (JHB) stock levels
                let stockJhb = 0;
                let stockCpt = 0;
                let totalStock = 0;

                if (attrs.stock && Array.isArray(attrs.stock.locations)) {
                    attrs.stock.locations.forEach(loc => {
                        const level = parseFloat(loc.stock_level) || 0;
                        const locName = (loc.name || '').toLowerCase();
                        const locSlug = (loc.slug || '').toLowerCase();

                        if (locName.includes('johannesburg') || locSlug.includes('jhb') || locSlug.includes('johannesburg')) {
                            stockJhb += level;
                        } else if (locName.includes('cape town') || locSlug.includes('cpt') || locSlug.includes('cape-town')) {
                            stockCpt += level;
                        }
                        totalStock += level;
                    });
                }

                // Extract images - prioritize tenancy URL since it provides the full absolute CDN path
                const imageUrl = attrs.metadata?.primary_image_tenancy_url || 
                                 attrs.metadata?.primary_image_url || '';

                // Safely extract category as a string (API may return objects)
                let rawCategory = attrs.category?.name || attrs.type || 'Networking';
                if (typeof rawCategory !== 'string') {
                    // Handle object/array category values gracefully
                    rawCategory = (rawCategory && typeof rawCategory === 'object')
                        ? (rawCategory.name || rawCategory.label || JSON.stringify(rawCategory))
                        : String(rawCategory);
                }
                const category = helpers.normalizeCategory(rawCategory, 'linkqage');

                mappedProducts.push({
                    supplier_sku: String(code).trim().substring(0, 255),
                    supplier_name: supplier.name,
                    name: String(attrs.name || '').substring(0, 250),
                    description: String(description),
                    brand: String(brand).substring(0, 100),
                    price_ex_vat: isNaN(priceExVat) ? 0 : priceExVat,
                    qty_on_hand: Math.round(totalStock),
                    stock_jhb: Math.round(stockJhb),
                    stock_cpt: Math.round(stockCpt),
                    image_url: String(imageUrl),
                    category: category,
                    master_sku: `${supplier.id}-${code}`.substring(0, 255),
                    raw_data: JSON.stringify(p)
                });
            } catch (mapErr) {
                skippedCount++;
                if (skippedCount <= 5) {
                    console.warn(`Linkqage: Skipped product (id=${p.id}): ${mapErr.message}`);
                }
            }
        }

        if (skippedCount > 0) {
            console.warn(`Linkqage: Total skipped products due to mapping errors: ${skippedCount}`);
        }

        console.log(`Linkqage: Successfully parsed ${mappedProducts.length} products`);
        return mappedProducts;

    } catch (error) {
        console.error('Linkqage: Driver Error:', error.message);
        return [];
    }
}

module.exports = linkqageDriver;
