import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface ScrapeResult {
  success: boolean;
  message: string;
  productsFound?: number;
  productsStored?: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { supplier = 'linkqage', username, password, testMode = true } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    // Path to the worker directory
    const workerPath = path.join(process.cwd(), '..', 'worker');
    
    return new Promise((resolve) => {
      // Run the generic scraper
      const scraper = spawn('node', ['-e', `
        const { GenericScraper, SUPPLIER_CONFIGS } = require('./src/generic-scraper');
        
        async function runScraper() {
          const config = SUPPLIER_CONFIGS['${supplier}'] || SUPPLIER_CONFIGS.generic;
          const scraper = new GenericScraper(config);
          
          try {
            await scraper.init();
            
            if (config.loginUrl) {
              const loginSuccess = await scraper.login('${username}', '${password}');
              if (!loginSuccess) {
                console.log('LOGIN_FAILED');
                return;
              }
            }
            
            const products = await scraper.scrapeAllProducts(${testMode});
            
            // Store products in database
            const response = await fetch('http://localhost:3000/api/admin/store-supplier-products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ supplier: '${supplier}', products })
            });
            
            const result = await response.json();
            console.log('STORAGE_RESULT:', JSON.stringify(result));
            console.log('PRODUCTS_FOUND:', products.length);
            
          } catch (error) {
            console.error('SCRAPER_ERROR:', error.message);
          } finally {
            await scraper.close();
          }
        }
        
        runScraper();
      `], {
        cwd: workerPath,
        env: {
          ...process.env,
          NODE_PATH: workerPath
        }
      });

      let output = '';
      let errorOutput = '';

      scraper.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Scraper output:', data.toString());
      });

      scraper.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Scraper error:', data.toString());
      });

      scraper.on('close', (code) => {
        if (code === 0) {
          // Parse results from output
          const lines = output.split('\n');
          const productsLine = lines.find(line => line.includes('PRODUCTS_FOUND:'));
          const productsFound = productsLine ? parseInt(productsLine.split(':')[1]) : 0;
          
          const storageResultLine = lines.find(line => line.includes('STORAGE_RESULT:'));
          let productsStored = 0;
          
          if (storageResultLine) {
            try {
              const storageResult = JSON.parse(storageResultLine.split('STORAGE_RESULT:')[1]);
              productsStored = storageResult.inserted + storageResult.updated;
            } catch (e) {
              console.error('Failed to parse storage result:', e);
            }
          }

          if (output.includes('LOGIN_FAILED')) {
            resolve(NextResponse.json({
              success: false,
              message: 'Login failed - please check credentials',
              output: output.slice(-1000)
            }, { status: 401 }));
          } else {
            resolve(NextResponse.json({
              success: true,
              message: testMode ? 'Test scraping completed successfully' : 'Full scraping completed',
              productsFound,
              productsStored,
              supplier,
              output: output.slice(-1000),
              testMode
            }));
          }
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Scraping failed',
            error: errorOutput || 'Unknown error',
            output: output.slice(-1000)
          }, { status: 500 }));
        }
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        scraper.kill();
        resolve(NextResponse.json({
          success: false,
          message: 'Scraping timed out after 10 minutes',
          output: output.slice(-1000)
        }, { status: 408 }));
      }, 10 * 60 * 1000);
    });

  } catch (error: any) {
    console.error('Generic scraping API error:', error);
    return NextResponse.json({
      success: false,
      message: `Scraping failed: ${error.message}`
    }, { status: 500 });
  }
}