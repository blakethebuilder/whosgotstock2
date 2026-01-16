/**
 * Driver for Evenflow (JSON API with authentication, pagination, and cookie support)
 */
const axios = require('axios');

async function evenflowDriver(supplier, feedData, helpers) {
    try {
        console.log(`Evenflow driver started for supplier: ${supplier.name}`);
        const baseUrl = supplier.url; // https://www.evenflow.online/B2BPricingFeed/GetB2BPricing

        // Determine login URL
        let loginUrl = baseUrl;
        if (baseUrl.toLowerCase().includes('/getb2bpricing')) {
            loginUrl = baseUrl.replace(/\/getb2bpricing/i, '/login');
        } else {
            loginUrl = baseUrl.endsWith('/') ? baseUrl + 'login' : baseUrl + '/login';
        }

        const email = (process.env.EVENFLOW_EMAIL || '').trim();
        const password = (process.env.EVENFLOW_PASSWORD || '').trim();

        if (!email || !password) {
            throw new Error('Missing EVENFLOW_EMAIL or EVENFLOW_PASSWORD environment variables');
        }

        console.log(`Evenflow: Attempting login at ${loginUrl}...`);

        // Login with cookie handling enabled
        const loginResponse = await axios.post(loginUrl, {
            Email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            },
            withCredentials: true
        });

        // Extract cookies from login response - IMPORTANT for some .NET APIs
        const cookies = loginResponse.headers['set-cookie'] || [];

        const loginData = loginResponse.data;
        let token = loginData.token || loginData.Token || loginData.access_token;

        if (!token && loginData.Data) {
            token = typeof loginData.Data === 'string' ? loginData.Data : loginData.Data.Token;
        }

        if (!token) {
            console.error('Evenflow Login Failed. Response keys:', Object.keys(loginData));
            throw new Error('Authentication failed: No token received from Evenflow');
        }

        console.log(`Evenflow: Authentication successful. Token found, ${cookies.length} cookies received.`);

        // Now fetch products with pagination
        const allProducts = [];
        let pageNumber = 1;
        const pageSize = 100;
        let hasMorePages = true;

        while (hasMorePages) {
            console.log(`Evenflow: Fetching page ${pageNumber}...`);

            try {
                // IMPORTANT: Evenflow requires a GET with a JSON body and session cookies
                const response = await axios({
                    method: 'GET',
                    url: baseUrl,
                    params: {
                        PageNumber: pageNumber,
                        PageSize: pageSize
                    },
                    data: {
                        PageNumber: pageNumber,
                        PageSize: pageSize
                    },
                    headers: {
                        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Cookie': cookies.join('; '),
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
                    if (pageNumber > 1000) break;
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
            .filter(p => p && (p.Sku || p.sku || p.SKU))
            .map(p => {
                const itemCode = p.Sku || p.sku || p.SKU;
                const priceStr = String(p.Price || p.price || '');

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

                // Handle complex Stock array or simple number
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
                } else {
                    totalStock = parseInt(p.Stock || p.stock || 0);
                }

                return {
                    supplier_sku: String(itemCode).trim().substring(0, 255),
                    supplier_name: supplier.name,
                    name: String(p.Name || p.name || p.product_name || '').substring(0, 250),
                    description: String(p.Description || p.description || ''),
                    brand: String(p.Manufacturer || p.manufacturer || p.brand || '').substring(0, 100),
                    price_ex_vat: hasPrice ? price : 0,
                    price_on_request: !hasPrice,
                    qty_on_hand: totalStock,
                    stock_jhb: stockJhb,
                    stock_cpt: stockCpt,
                    image_url: String(p.PictureUrl || p.pictureUrl || p.Image || p.image || ''),
                    category: helpers.normalizeCategory(p.Category || p.category, 'evenflow'),
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