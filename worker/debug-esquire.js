const { XMLParser } = require('fast-xml-parser');

async function debugEsquireFeed() {
    // You'll need to replace this with the actual Esquire feed URL
    const esquireUrl = 'YOUR_ESQUIRE_FEED_URL_HERE';
    
    try {
        console.log('Fetching Esquire feed...');
        const res = await fetch(esquireUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(30000)
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const xmlData = await res.text();
        console.log('Raw XML sample (first 1000 chars):');
        console.log(xmlData.substring(0, 1000));
        console.log('\n' + '='.repeat(50) + '\n');
        
        const parser = new XMLParser();
        const parsed = parser.parse(xmlData);
        
        console.log('Parsed structure:');
        console.log(JSON.stringify(parsed, null, 2).substring(0, 2000));
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Try to find products
        let products = [];
        if (parsed.ROOT?.products?.product) {
            products = parsed.ROOT.products.product;
        } else if (parsed.products?.product) {
            products = parsed.products.product;
        }
        
        if (!Array.isArray(products)) products = products ? [products] : [];
        
        console.log(`Found ${products.length} products`);
        
        if (products.length > 0) {
            console.log('\nFirst 3 products with stock info:');
            products.slice(0, 3).forEach((p, i) => {
                console.log(`\nProduct ${i + 1}:`);
                console.log(`  ProductCode: ${p.ProductCode}`);
                console.log(`  ProductName: ${p.ProductName}`);
                console.log(`  AvailableQty: "${p.AvailableQty}" (type: ${typeof p.AvailableQty})`);
                console.log(`  Price: ${p.Price}`);
                console.log(`  All fields:`, Object.keys(p));
            });
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

debugEsquireFeed();