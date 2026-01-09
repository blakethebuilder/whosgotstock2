'use client';

import { useState } from 'react';

interface ScrapeResult {
  success: boolean;
  message: string;
  productsFound?: number;
  productsImported?: number;
  output?: string;
  testMode?: boolean;
}

export default function LinkqageScraper() {
  const [username, setUsername] = useState(process.env.NEXT_PUBLIC_ESQUIRE_EMAIL || '');
  const [password, setPassword] = useState('');
  const [isScrapingTest, setIsScrapingTest] = useState(false);
  const [isScrapingFull, setIsScrapingFull] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleScrape = async (testMode: boolean) => {
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    if (testMode) {
      setIsScrapingTest(true);
    } else {
      setIsScrapingFull(true);
    }
    
    setResult(null);

    try {
      const response = await fetch('/api/admin/scrape-linkqage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          testMode
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Request failed: ${error.message}`
      });
    } finally {
      setIsScrapingTest(false);
      setIsScrapingFull(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Linkqage Scraper (Legacy)</h2>
          <p className="text-sm text-gray-600">Original Linkqage-specific scraper</p>
        </div>
      </div>

      {!result && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Username
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder="your-supplier-email@domain.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12"
                placeholder="Your supplier password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Scraping Options:</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Test Mode (First Page Only)</p>
                  <p className="text-sm text-blue-600">Quick test to verify login and scraping (~36 products)</p>
                </div>
                <button
                  onClick={() => handleScrape(true)}
                  disabled={isScrapingTest || isScrapingFull}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isScrapingTest ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Testing...
                    </>
                  ) : (
                    'Test Scrape'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-800">Full Scrape (All Products)</p>
                  <p className="text-sm text-purple-600">Scrape all 2,497+ products (takes 10-15 minutes)</p>
                </div>
                <button
                  onClick={() => handleScrape(false)}
                  disabled={isScrapingTest || isScrapingFull}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isScrapingFull ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Scraping...
                    </>
                  ) : (
                    'Full Scrape'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Important Notes:</p>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Uses your supplier login to get wholesale pricing</li>
                  <li>• Test mode first to verify credentials work</li>
                  <li>• Full scrape will take 10-15 minutes for all products</li>
                  <li>• Products will be stored in separate manual_products table</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`rounded-xl p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.success ? 'bg-green-600' : 'bg-red-600'}`}>
              {result.success ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 className={`text-lg font-bold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.success ? 'Scraping Successful!' : 'Scraping Failed'}
            </h3>
          </div>
          
          <p className={`mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.message}
          </p>

          {result.productsFound && (
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
              <p className="text-2xl font-black text-green-700">{result.productsFound}</p>
              <p className="text-sm text-green-600">Products Found</p>
            </div>
          )}

          {result.output && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-40 overflow-y-auto">
              <pre>{result.output}</pre>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setResult(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Run Another Scrape
            </button>
            
            {result.success && result.testMode && (
              <button
                onClick={() => handleScrape(false)}
                disabled={isScrapingFull}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isScrapingFull ? 'Running Full Scrape...' : 'Run Full Scrape Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}