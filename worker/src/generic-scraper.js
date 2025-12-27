const puppeteer = require('puppeteer');
const fs = require('fs');

class GenericScraper {
  constructor(config) {
    this.config = {
      supplierName: config.supplierName || 'Unknown',
      loginUrl: config.loginUrl,
      shopUrl: config.shopUrl,
      selectors: {
        username: config.selectors?.username || '#username',
        password: config.selectors?.password || '#password',
        loginButton: config.selectors?.loginButton || 'button[type="submit"]',
        product: config.selectors?.product || '.product',
        productName: config.selectors?.productName || '.product-title',
        productPrice: config.selectors?.productPrice || '.price',
        productLink: config.selectors?.productLink || 'a',
        productImage: config.selectors?.productImage || 'img',
        nextButton: config.selectors?.nextButton || '.next',
        ...config.selectors
      },
      pagination: {
        enabled: config.pagination?.enabled !== false,
        maxPages: config.pagination?.maxPages || 100,
        delay: config.pagination?.delay || 2000
      },
      ...config
    };
    
    this.browser = null;
    this.page = null;
    this.products = [];
  }

  async init() {
    console.log(`🚀 Initializing ${this.config.supplierName} scraper...`);
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless !== false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async login(username, password) {
    if (!this.config.loginUrl) {
      console.log('⚠️ No login URL configured, skipping login...');
      return true;
    }

    console.log(`🔐 Logging into ${this.config.supplierName}...`);
    
    try {
      await this.page.goto(this.config.loginUrl, { waitUntil: 'networkidle2' });
      
      // Wait for login form
      await this.page.waitForSelector(this.config.selectors.username, { timeout: 10000 });
      
      // Fill credentials
      await this.page.type(this.config.selectors.username, username);
      await this.page.type(this.config.selectors.password, password);
      
      // Click login button
      await this.page.click(this.config.selectors.loginButton);
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Check if login was successful (can be customized per supplier)
      const currentUrl = this.page.url();
      const loginSuccess = await this.checkLoginSuccess(currentUrl);
      
      if (loginSuccess) {
        console.log('✅ Login successful!');
        return true;
      } else {
        console.log('❌ Login failed - check credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error.message);
      return false;
    }
  }

  async checkLoginSuccess(currentUrl) {
    // Default implementation - can be overridden
    return !currentUrl.includes('login') && !currentUrl.includes('sign-in');
  }

  async scrapeAllProducts(testMode = false) {
    console.log(`🕷️ Starting product scraping for ${this.config.supplierName}...`);
    
    if (!this.config.shopUrl) {
      throw new Error('Shop URL not configured');
    }

    await this.page.goto(this.config.shopUrl, { waitUntil: 'networkidle2' });

    let currentPage = 1;
    let hasNextPage = true;
    const maxPages = testMode ? 1 : this.config.pagination.maxPages;

    while (hasNextPage && currentPage <= maxPages) {
      console.log(`📄 Scraping page ${currentPage}...`);
      
      // Wait for products to load
      await this.page.waitForSelector(this.config.selectors.product, { timeout: 10000 });
      
      // Extract products from current page
      const pageProducts = await this.extractProductsFromPage();
      
      this.products.push(...pageProducts);
      console.log(`   Found ${pageProducts.length} products on page ${currentPage}`);

      if (testMode || !this.config.pagination.enabled) {
        hasNextPage = false;
      } else {
        // Check for next page
        hasNextPage = await this.goToNextPage();
        if (hasNextPage) {
          currentPage++;
          await this.page.waitForTimeout(this.config.pagination.delay);
        }
      }
    }

    console.log(`🎯 Total products scraped: ${this.products.length}`);
    return this.products;
  }

  async extractProductsFromPage() {
    return await this.page.evaluate((selectors, supplierName) => {
      const products = [];
      const productElements = document.querySelectorAll(selectors.product);
      
      productElements.forEach(element => {
        try {
          const nameElement = element.querySelector(selectors.productName);
          const priceElement = element.querySelector(selectors.productPrice);
          const linkElement = element.querySelector(selectors.productLink);
          const imageElement = element.querySelector(selectors.productImage);
          
          if (nameElement && priceElement) {
            const name = nameElement.textContent.trim();
            const priceText = priceElement.textContent.trim();
            const link = linkElement ? linkElement.href : null;
            const image = imageElement ? imageElement.src : null;
            
            // Extract price (remove currency symbols and other characters)
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            
            if (name && price > 0) {
              products.push({
                name,
                price,
                link,
                image,
                supplier: supplierName,
                rawPriceText: priceText
              });
            }
          }
        } catch (err) {
          console.log('Error parsing product:', err.message);
        }
      });
      
      return products;
    }, this.config.selectors, this.config.supplierName);
  }

  async goToNextPage() {
    try {
      const nextButton = await this.page.$(this.config.selectors.nextButton);
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
        return true;
      }
      return false;
    } catch (error) {
      console.log('No more pages found');
      return false;
    }
  }

  async saveToFile(filename) {
    if (!filename) {
      filename = `${this.config.supplierName.toLowerCase().replace(/\s+/g, '-')}-products.json`;
    }
    
    const data = {
      supplier: this.config.supplierName,
      scrapedAt: new Date().toISOString(),
      totalProducts: this.products.length,
      products: this.products
    };
    
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${this.products.length} products to ${filename}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Predefined supplier configurations
const SUPPLIER_CONFIGS = {
  linkqage: {
    supplierName: 'Linkqage',
    loginUrl: 'https://www.linkqage.com/my-account/',
    shopUrl: 'https://www.linkqage.com/shop/',
    selectors: {
      username: '#username',
      password: '#password',
      loginButton: 'button[name="login"]',
      product: '.product',
      productName: '.woocommerce-loop-product__title',
      productPrice: '.price .amount, .price',
      productLink: 'a',
      productImage: 'img',
      nextButton: '.next.page-numbers'
    }
  },
  
  // Template for other suppliers
  generic: {
    supplierName: 'Generic Supplier',
    loginUrl: null, // Set to null if no login required
    shopUrl: 'https://example.com/shop/',
    selectors: {
      username: '#username',
      password: '#password',
      loginButton: 'button[type="submit"]',
      product: '.product',
      productName: '.product-title',
      productPrice: '.price',
      productLink: 'a',
      productImage: 'img',
      nextButton: '.next'
    }
  }
};

module.exports = { GenericScraper, SUPPLIER_CONFIGS };