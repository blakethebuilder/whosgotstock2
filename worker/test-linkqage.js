const { LinkqageScraper } = require('./src/linkqage-scraper');

async function testLinkqage() {
  console.log('🚀 Testing Linkqage scraper...');
  
  const scraper = new LinkqageScraper();
  
  try {
    await scraper.init();
    
    const username = process.env.LINKQAGE_USERNAME;
    const password = process.env.LINKQAGE_PASSWORD;
    const testMode = process.env.TEST_MODE === 'true';
    
    if (!username || !password) {
      console.log('❌ Please set LINKQAGE_USERNAME and LINKQAGE_PASSWORD environment variables');
      process.exit(1);
    }
    
    // Test login
    console.log('🔐 Attempting login...');
    const loginSuccess = await scraper.login(username, password);
    if (!loginSuccess) {
      console.log('❌ Login failed - please check credentials');
      process.exit(1);
    }
    
    console.log('✅ Login successful!');
    
    if (testMode) {
      console.log('🧪 Running in test mode - scraping first page only...');
      
      await scraper.page.goto('https://www.linkqage.com/shop/', { 
        waitUntil: 'networkidle2' 
      });
      
      // Get first page products
      const products = await scraper.page.evaluate(() => {
        const products = [];
        const productElements = document.querySelectorAll('.product');
        
        productElements.forEach(element => {
          try {
            const nameElement = element.querySelector('.woocommerce-loop-product__title');
            const priceElement = element.querySelector('.price .amount') || element.querySelector('.price');
            const linkElement = element.querySelector('a');
            
            if (nameElement && priceElement && linkElement) {
              const name = nameElement.textContent.trim();
              const priceText = priceElement.textContent.trim();
              const link = linkElement.href;
              
              // Extract price
              const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
              
              if (name && price > 0) {
                products.push({
                  name,
                  price,
                  link,
                  supplier: 'Linkqage'
                });
              }
            }
          } catch (err) {
            console.log('Error parsing product:', err.message);
          }
        });
        
        return products;
      });
      
      console.log(`🎯 Found ${products.length} products on first page`);
      if (products.length > 0) {
        console.log('Sample products:');
        products.slice(0, 3).forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} - R${product.price}`);
        });
        console.log('✅ Test completed successfully!');
      }
    } else {
      console.log('🕷️ Running full scrape - this will take 10-15 minutes...');
      const allProducts = await scraper.scrapeAllProducts();
      console.log(`🎉 Full scrape completed! Found ${allProducts.length} total products`);
      
      // Save to file
      await scraper.saveToFile('linkqage-products.json');
    }
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

testLinkqage();