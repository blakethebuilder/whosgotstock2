/**
 * Driver for Evenflow (JSON API with authentication and pagination)
 */
const axios = require('axios');

async function evenflowDriver(supplier, feedData, helpers) {
    try {
        console.log(`Evenflow driver started for supplier: ${supplier.name}`);
        console.log(`Supplier URL: ${supplier.url}`);
        console.log(`Supplier config:`, { id: supplier.id, name: supplier.name, type: supplier.type });

        // The feedData here is actually the supplier URL, not the response
        // We need to handle authentication and pagination ourselves
        const baseUrl = supplier.url; // https://www.evenflow.online/B2BPricingFeed/GetB2BPricing

        // Get authentication token first
        const loginUrl = baseUrl.replace('/GetB2BPricing', '/login');
        const email = process.env.EVENFLOW_EMAIL || 'blake@smartintegrate.co.za';
        const password = process.env.EVENFLOW_PASSWORD || 'Smart@2026!';

        console.log('Evenflow: Environment check - Email:', email ? 'Set' : 'Not set');
        console.log('Evenflow: Environment check - Password:', password ? 'Set' : 'Not set');
        console.log('Evenflow: Login URL:', loginUrl);
        console.log('Evenflow: Attempting login...');

        // Login with cookie handling
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

        console.log('Evenflow: Login response received');
        console.log('Evenflow: Login response status:', loginResponse.status);
        console.log('Evenflow: Full login response:', JSON.stringify(loginResponse.data, null, 2));

        // Extract cookies from login response
        const cookies = loginResponse.headers['set-cookie'] || [];
        console.log('Evenflow: Cookies received:', cookies.length);

        const loginData = loginResponse.data;

        const token = loginData.token ||
                      loginData.access_token ||
                      loginData.jwt ||
                      loginData.Token ||
                      loginData.AccessToken ||
                      (loginData.Data && loginData.Data.Token) ||
                      (loginData.data && loginData.data.token);

        console.log('Evenflow: Token found:', token ? 'Yes' : 'No');
        if (token) {
            console.log('Evenflow: Token preview:', token.substring(0, 50) + '...');
        }

        if (!token) {
            console.error('Evenflow: Full login response:', JSON.stringify(loginData, null, 2));
            throw new Error('No token received from login response');
        }

        console.log('Evenflow: Token extracted successfully');

        console.log('Evenflow: Login successful, fetching products...');

        // Now fetch products with pagination
        const allProducts = [];
        let pageNumber = 1;
        const pageSize = 100; // From Postman example
        let hasMorePages = true;

        while (hasMorePages) {
            // Evenflow API requires GET with body (non-standard)
            // Using axios which supports this
            console.log(`Evenflow: Fetching page ${pageNumber} from ${baseUrl}`);
            console.log(`Evenflow: Using token: ${token.substring(0, 30)}...`);

            const response = await axios.get(baseUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cookie': cookies.join('; '),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
                },
                data: {
                    PageNumber: pageNumber,
                    PageSize: pageSize
                }
            });

            console.log(`Evenflow: Response status ${response.status} for page ${pageNumber}`);

            const data = response.data;

            // Handle different response structures
            if (data.Message && data.Message !== '' && !Array.isArray(data.Message)) {
                console.warn(`Evenflow API: Message from server: ${data.Message}`);
            }

            let products = [];
            if (Array.isArray(data)) {
                products = data;
            } else if (data.Data && Array.isArray(data.Data)) {
                products = data.Data;
            } else if (data.products && Array.isArray(data.products)) {
                products = data.products;
            } else if (data.data && Array.isArray(data.data)) {
                products = data.data;
            } else if (data.items && Array.isArray(data.items)) {
                products = data.items;
            } else {
                console.warn(`Evenflow API: Unexpected JSON structure on page ${pageNumber}, expected array or {Data/products/data/items: [...]}`, Object.keys(data));
                break;
            }

            if (products.length === 0) {
                hasMorePages = false;
            } else {
                allProducts.push(...products);
                pageNumber++;

                // Safety check to prevent infinite loops
                if (pageNumber > 1000) {
                    console.warn('Evenflow API: Too many pages, stopping at page 1000');
                    break;
                }
            }

            // Small delay to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Evenflow: Retrieved ${allProducts.length} products from ${pageNumber - 1} pages`);

        return allProducts
            .filter(p => p && (p.Sku || p.sku || p.SKU)) // Ensure product has identifier
            .map(p => {
                // Map Evenflow API fields to our schema based on actual API response
                const itemCode = p.Sku || p.sku || p.SKU || '';
                const productName = p.Name || p.name || '';
                const priceStr = String(p.Price || p.price || '');
                
                // Parse price - handle "R476 756,21 excl VAT" format and "Call for pricing"
                let price = 0;
                let hasPrice = false;
                if (priceStr && !priceStr.toLowerCase().includes('call')) {
                    // Remove "R", spaces, " excl VAT", and convert comma to decimal
                    const cleanPrice = priceStr
                        .replace(/R/g, '')
                        .replace(/\s/g, '')
                        .replace(/excl VAT/gi, '')
                        .replace(/,/g, '.');
                    price = parseFloat(cleanPrice);
                    hasPrice = !isNaN(price) && price > 0;
                }

                // Stock is an array, so set to 0 if empty
                const stockQuantity = Array.isArray(p.Stock) ? 0 : parseInt(p.Stock || 0);

                return {
                    supplier_sku: String(itemCode).trim().substring(0, 255),
                    supplier_name: supplier.name,
                    name: String(productName).substring(0, 250),
                    description: String(p.Description || ''), // Use description field
                    brand: String(p.Manufacturer || p.manufacturer || '').substring(0, 100),
                    price_ex_vat: hasPrice ? price : 0,
                    price_on_request: !hasPrice, // Flag for "price on request"
                    qty_on_hand: stockQuantity,
                    stock_jhb: 0, // Evenflow doesn't provide branch-specific stock
                    stock_cpt: 0, // Evenflow doesn't provide branch-specific stock
                    image_url: String(p.PictureUrl || p.pictureUrl || p.Image || ''),
                    category: helpers.normalizeCategory(p.Category || p.category, 'evenflow'),
                    master_sku: `${supplier.id}-${itemCode}`.substring(0, 255),
                    raw_data: JSON.stringify(p)
                };
            })
            .filter(p => p.supplier_sku); // Keep products even without price (will show "price on request")

    } catch (error) {
        console.error('Evenflow API: Error:', error.message);
        return [];
    }
}

module.exports = evenflowDriver;