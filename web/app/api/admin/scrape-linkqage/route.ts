import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import pool from '@/lib/db';

interface ScrapeResult {
  success: boolean;
  message: string;
  productsFound?: number;
  productsImported?: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, testMode = true } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    // Path to the worker directory
    const workerPath = path.join(process.cwd(), '..', 'worker');
    
    return new Promise((resolve) => {
      // Run the scraper as a child process
      const scraper = spawn('node', ['test-linkqage.js'], {
        cwd: workerPath,
        env: {
          ...process.env,
          LINKQAGE_USERNAME: username,
          LINKQAGE_PASSWORD: password,
          TEST_MODE: testMode ? 'true' : 'false'
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
          // Parse the output to extract results
          const lines = output.split('\n');
          const productsLine = lines.find(line => line.includes('Found') && line.includes('products'));
          const productsFound = productsLine ? parseInt(productsLine.match(/\d+/)?.[0] || '0') : 0;

          resolve(NextResponse.json({
            success: true,
            message: testMode ? 'Test scraping completed successfully' : 'Full scraping completed',
            productsFound,
            output: output.slice(-1000), // Last 1000 chars of output
            testMode
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Scraping failed',
            error: errorOutput || 'Unknown error',
            output: output.slice(-1000)
          }, { status: 500 }));
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        scraper.kill();
        resolve(NextResponse.json({
          success: false,
          message: 'Scraping timed out after 5 minutes',
          output: output.slice(-1000)
        }, { status: 408 }));
      }, 5 * 60 * 1000);
    });

  } catch (error: any) {
    console.error('Linkqage scraping API error:', error);
    return NextResponse.json({
      success: false,
      message: `Scraping failed: ${error.message}`
    }, { status: 500 });
  }
}