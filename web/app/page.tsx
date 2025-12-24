'use client';

import { useState } from 'react';

// Pricing logic: Guest = +5%, Account = Raw Price
// We'll simulate "Account" status with a simple toggle for this demo.

interface Product {
  id: number;
  name: string;
  brand: string;
  price_ex_vat: string; // Decimal comes as string from PG
  qty_on_hand: number;
  supplier_sku: string;
  supplier_name: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isAccount, setIsAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    if (isAccount) {
      return price.toFixed(2);
    }
    // Guest pays 5% more
    return (price * 1.05).toFixed(2);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">WhosGotStock</h1>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <span className={!isAccount ? "font-bold" : ""}>Guest</span>
            <button
              onClick={() => setIsAccount(!isAccount)}
              className={"w-12 h-6 rounded-full p-1 transition-colors " + (isAccount ? "bg-green-500" : "bg-gray-400")}
            >
              <div className={"bg-white w-4 h-4 rounded-full shadow-md transform transition-transform " + (isAccount ? "translate-x-6" : "")}></div>
            </button>
            <span className={isAccount ? "font-bold" : ""}>Account Holder</span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by product name, brand, or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results */}
        <div className="space-y-4">
          {results.length === 0 && !loading && (
            <p className="text-gray-500 text-center">No products found. (Try searching for "Laptop" or "Monitor")</p>
          )}

          {results.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded shadow hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg">{product.name}</h2>
                  <p className="text-sm text-gray-600">{product.brand} | SKU: {product.supplier_sku}</p>
                  <p className="text-xs text-gray-400 mt-1">Supplier: {product.supplier_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-700">
                    R {calculatePrice(product.price_ex_vat)} <span className="text-xs font-normal text-gray-500">ex VAT</span>
                  </p>
                  <p className={`text-sm ${product.qty_on_hand > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.qty_on_hand > 0 ? `${product.qty_on_hand} in stock` : 'Out of Stock'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
