/**
 * Driver for Evenflow (JSON API with authentication and pagination)
 */
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

        const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                Email: email,
                password: password
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        console.log('Evenflow: Login response received');
        console.log('Evenflow: Login response status:', loginResponse.status);

        const token = loginData.token ||
                      loginData.access_token ||
                      loginData.jwt ||
                      loginData.Token ||
                      loginData.AccessToken ||
                      (loginData.Data && loginData.Data.Token) ||
                      (loginData.data && loginData.data.token);

        console.log('Evenflow: Token found:', token ? 'Yes' : 'No');
        console.log('Evenflow: Login response keys:', Object.keys(loginData));

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
            console.log(`Evenflow: Fetching page ${pageNumber} from ${baseUrl}`);
            console.log(`Evenflow: Request URL: ${paginatedUrl}`);

            const response = await fetch(paginatedUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify({
                    PageNumber: pageNumber,
                    PageSize: pageSize
                })
            });

            console.log(`Evenflow: Response status ${response.status} for page ${pageNumber}`);

            if (!response.ok) {
                console.error(`Evenflow: API Error - ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error(`Evenflow: Error response: ${errorText.substring(0, 500)}`);
                throw new Error(`Evenflow API returned ${response.status}: ${response.statusText}`);
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Handle different response structures
            let products = [];
            if (Array.isArray(data)) {
                products = data;
            } else if (data.products && Array.isArray(data.products)) {
                products = data.products;
            } else if (data.data && Array.isArray(data.data)) {
                products = data.data;
            } else if (data.items && Array.isArray(data.items)) {
                products = data.items;
            } else {
                console.warn(`Evenflow API: Unexpected JSON structure on page ${pageNumber}, expected array or {products/data/items: [...]}`, Object.keys(data));
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
            .filter(p => p && (p.ItemCode || p.SKU || p.ProductCode || p.Code)) // Ensure product has identifier
            .map(p => {
                // Map Evenflow API fields to our schema
                const itemCode = p.ItemCode || p.SKU || p.ProductCode || p.Code || '';
                const productName = p.ProductName || p.Name || p.Description || p.ItemDescription || '';
                const price = parseFloat(p.SellingPrice || p.Price || p.UnitPrice || 0);
                const qtyAvailable = parseInt(p.QtyAvailable || p.Quantity || p.Stock || 0);

                return {
                    supplier_sku: String(itemCode).trim().substring(0, 255),
                    supplier_name: supplier.name,
                    name: String(productName).substring(0, 250),
                    description: String(p.Description || p.ItemDescription || productName || ''),
                    brand: String(p.Brand || p.Manufacturer || 'Evenflow').substring(0, 100),
                    price_ex_vat: price,
                    qty_on_hand: qtyAvailable,
                    stock_jhb: parseInt(p.QtyJHB || p.StockJHB || 0),
                    stock_cpt: parseInt(p.QtyCPT || p.StockCPT || 0),
                    image_url: String(p.ImageUrl || p.Image || p.ProductImage || ''),
                    category: helpers.normalizeCategory(p.Category || p.ProductCategory || p.Group, 'evenflow'),
                    master_sku: `${supplier.id}-${itemCode}`.substring(0, 255),
                    raw_data: JSON.stringify(p)
                };
            })
            .filter(p => p.price_ex_vat > 0 && p.supplier_sku); // Filter out invalid products

    } catch (error) {
        console.error('Evenflow API: Error:', error.message);
        return [];
    }
}

module.exports = evenflowDriver;