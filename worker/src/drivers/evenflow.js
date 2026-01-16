/**
 * Driver for Evenflow (JSON API with authentication and pagination)
 */
const axios = require('axios');

async function evenflowDriver(supplier, feedData, helpers) {
    try {
        console.log(`Evenflow driver started for supplier: ${supplier.name}`);
        const baseUrl = supplier.url; // https://www.evenflow.online/B2BPricingFeed/GetB2BPricing

        // Get authentication credentials from environment variables
        const loginUrl = baseUrl.replace('/GetB2BPricing', '/login');
        const email = process.env.EVENFLOW_EMAIL;
        const password = process.env.EVENFLOW_PASSWORD;

        if (!email || !password) {
            throw new Error('Missing EVENFLOW_EMAIL or EVENFLOW_PASSWORD environment variables');
        }

        console.log('Evenflow: Attempting login...');

        // Login to get bearer token
        const loginResponse = await axios.post(loginUrl, {
            Email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            }
        });

        const loginData = loginResponse.data;
        const token = loginData.token ||
            loginData.Token ||
            (loginData.Data && loginData.Data.Token);

        if (!token) {
            throw new Error('Authentication failed: No token received from Evenflow');
        }

        console.log('Evenflow: Authentication successful');

        // Now fetch products with pagination
        const allProducts = [];
        let pageNumber = 1;
        const pageSize = 100;
        let hasMorePages = true;

        while (hasMorePages) {
            console.log(`Evenflow: Fetching page ${pageNumber}...`);

            try {
                const response = await axios({
                    method: 'GET',
                    url: baseUrl,
                    data: {
                        PageNumber: pageNumber,
                        PageSize: pageSize
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
                    }
                });

                const data = response.data;
                const products = data.Data || data.data || (data.Result && data.Result.Data) || [];

                if (!Array.isArray(products) || products.length === 0) {
                    if (pageNumber === 1) {
                        console.log(`Evenflow: Page 1 returned no products. Response keys: ${Object.keys(data).join(', ')}`);
                        if (data.Message) console.log(`Evenflow Message: ${data.Message}`);
                    }
                    hasMorePages = false;
                } else {
                    allProducts.push(...products);
                    console.log(`Evenflow: Harvested ${products.length} items from page ${pageNumber}`);
                    pageNumber++;
                    if (pageNumber > 500) break;
                }
            } catch (err) {
                console.error(`Evenflow API Page ${pageNumber} Error:`, err.message);
                if (err.response) {
                    console.error('Evenflow Error Detail:', JSON.stringify(err.response.data));
                }
                hasMorePages = false;
            }

            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`Evenflow: Processing ${allProducts.length} products`);

        return allProducts
            .filter(p => p && (p.Sku || p.sku))
            .map(p => {
                const itemCode = p.Sku || p.sku;
                const priceStr = String(p.Price || '');

                // Parse price (e.g., "R476 756,21 excl VAT")
                let price = 0;
                let hasPrice = false;
                if (priceStr && !priceStr.toLowerCase().includes('call')) {
                    const cleanPrice = priceStr
                        .replace(/R/g, '')
                        .replace(/\s/g, '')
                        .replace(/excl VAT/gi, '')
                        .replace(/,/g, '.');
                    price = parseFloat(cleanPrice);
                    hasPrice = !isNaN(price) && price > 0;
                }

                // Parse complex Stock array for branch-specific values
                let stockJhb = 0;
                let stockCpt = 0;
                let totalStock = 0;

                if (Array.isArray(p.Stock)) {
                    p.Stock.forEach(entry => {
                        if (entry.Johannesburg) {
                            const val = parseInt(entry.Johannesburg);
                            if (!isNaN(val)) stockJhb += val;
                        }
                        if (entry["Cape Town"]) {
                            const val = parseInt(entry["Cape Town"]);
                            if (!isNaN(val)) stockCpt += val;
                        }
                    });
                    totalStock = stockJhb + stockCpt;
                } else if (p.Stock) {
                    totalStock = parseInt(p.Stock) || 0;
                }

                return {
                    supplier_sku: String(itemCode).trim().substring(0, 255),
                    supplier_name: supplier.name,
                    name: String(p.Name || '').substring(0, 250),
                    description: String(p.Description || ''),
                    brand: String(p.Manufacturer || '').substring(0, 100),
                    price_ex_vat: hasPrice ? price : 0,
                    price_on_request: !hasPrice,
                    qty_on_hand: totalStock,
                    stock_jhb: stockJhb,
                    stock_cpt: stockCpt,
                    image_url: String(p.PictureUrl || ''),
                    category: helpers.normalizeCategory(p.Category, 'evenflow'),
                    master_sku: `${supplier.id}-${itemCode}`.substring(0, 255),
                    raw_data: JSON.stringify(p)
                };
            });

    } catch (error) {
        console.error('Evenflow API Error:', error.message);
        return [];
    }
}

module.exports = evenflowDriver;