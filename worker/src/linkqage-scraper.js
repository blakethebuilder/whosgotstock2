const { GenericScraper, SUPPLIER_CONFIGS } = require('./generic-scraper');

class LinkqageScraper extends GenericScraper {
  constructor() {
    super(SUPPLIER_CONFIGS.linkqage);
  }

  // Override login success check for Linkqage
  async checkLoginSuccess(currentUrl) {
    return currentUrl.includes('my-account') && !currentUrl.includes('login');
  }
}

// Usage example
async function scrapeLinkqage() {
  const scraper = new LinkqageScraper();
  
  try {
    await scraper.init();
    
    // Login with your supplier credentials
    const username = process.env.LINKQAGE_USERNAME || 'your-username';
    const password = process.env.LINKQAGE_PASSWORD || 'your-password';
    
    const loginSuccess = await scraper.login(username, password);
    if (!loginSuccess) {
      console.log('❌ Failed to login, exiting...');
      return;
    }
    
    // Scrape all products
    const testMode = process.env.TEST_MODE === 'true';
    await scraper.scrapeAllProducts(testMode);
    
    // Save to file
    await scraper.saveToFile();
    
    console.log('🎉 Scraping completed successfully!');
    
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Export for use in other files
module.exports = { LinkqageScraper, scrapeLinkqage };

// Run if called directly
if (require.main === module) {
  scrapeLinkqage();
}