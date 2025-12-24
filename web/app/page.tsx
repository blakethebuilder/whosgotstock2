'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MegaFilterDropdown from './components/MegaFilterDropdown';
import CartDrawer, { CartItem } from './components/CartDrawer';

// Pricing logic: Guest = +15%, Account = Raw Price
interface Product {
  id: number;
  name: string;
  brand: string;
  price_ex_vat: string;
  qty_on_hand: number;
  supplier_sku: string;
  supplier_name: string;
  image_url?: string;
}

interface Supplier {
  name: string;
  slug: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isAccount, setIsAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Filters
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter States
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const [showFilters, setShowFilters] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Featured Data
  const [featured, setFeatured] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    // Load suppliers
    fetch('/api/suppliers').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSuppliers(data);
    }).catch(console.error);

    // Initial load of featured rows
    fetch('/api/featured').then(r => r.json()).then(data => {
      setFeatured(data);
    }).catch(console.error);
  }, []);

  // Update Brands & Categories when supplier changes
  useEffect(() => {
    const urlParams = selectedSupplier ? `?supplier=${selectedSupplier}` : '';

    // Reset selections when supplier changes to avoid invalid combinations
    setSelectedBrands([]);
    setSelectedCategories([]);

    fetch(`/api/brands${urlParams}`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setBrands(data);
    }).catch(console.error);

    fetch(`/api/categories${urlParams}`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCategories(data);
    }).catch(console.error);
  }, [selectedSupplier]);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('whosgotstock_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('whosgotstock_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        brand: product.brand,
        supplier_sku: product.supplier_sku,
        supplier_name: product.supplier_name,
        price_ex_vat: product.price_ex_vat,
        quantity: 1
      }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeCartItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Allow search if params exist even if query is empty
    if (!query && !selectedSupplier && selectedBrands.length === 0 && selectedCategories.length === 0) {
      if (!hasSearched) return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (selectedSupplier) params.append('supplier', selectedSupplier);
      if (selectedBrands.length > 0) params.append('brand', selectedBrands.join(','));
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        q: query,
        page: nextPage.toString()
      });

      if (selectedSupplier) params.append('supplier', selectedSupplier);
      if (selectedBrands.length > 0) params.append('brand', selectedBrands.join(','));
      if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      setResults(prev => [...prev, ...(data.results || [])]);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    const markedUp = isAccount ? price : price * 1.15;
    const incVat = markedUp * 1.15;

    return {
      exVat: markedUp.toFixed(2),
      incVat: incVat.toFixed(2)
    };
  };

  const clearSearch = () => {
    setQuery('');
    setHasSearched(false);
    setResults([]);
    setSelectedBrands([]);
    setSelectedSupplier('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setShowFilters(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Navbarish Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 cursor-pointer" onClick={clearSearch}>WhosGotStock</h1>
        </div>
        <div className="flex gap-4 items-center pointer-events-auto">
          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors bg-white/80 backdrop-blur rounded-full shadow-sm border"
            title="View Quote Cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-sm shadow-sm border">
            <span className={!isAccount ? "font-bold text-gray-800" : "text-gray-500"}>Guest</span>
            <button
              onClick={() => setIsAccount(!isAccount)}
              className={"w-10 h-5 rounded-full p-0.5 transition-colors " + (isAccount ? "bg-green-500" : "bg-gray-300")}
            >
              <div className={"bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform " + (isAccount ? "translate-x-5" : "")}></div>
            </button>
            <span className={isAccount ? "font-bold text-gray-800" : "text-gray-500"}>Account</span>
          </div>
          <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-blue-600">Admin</Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`transition-all duration-500 ease-in-out ${hasSearched ? 'pt-24 pb-8 min-h-[auto]' : 'h-[60vh] flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-100'}`}>
        <div className={`w-full max-w-4xl px-4 mx-auto ${hasSearched ? '' : 'text-center'}`}>
          {!hasSearched && (
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Find IT Stock, <span className="text-blue-600">Instantly.</span>
            </h2>
          )}

          <div className={`bg-white rounded-xl shadow-lg transition-all relative z-50 ${hasSearched ? 'ring-1 ring-gray-200' : 'scale-105'}`}>
            <form onSubmit={handleSearch} className="flex items-center w-full border-b border-gray-100">
              <div className="pl-4 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="text"
                className="flex-1 p-4 text-lg focus:outline-none"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 text-sm font-medium border-l border-r border-gray-100 hover:bg-gray-50 flex items-center gap-2 ${showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Filters
                {(selectedBrands.length > 0 || selectedSupplier || selectedCategories.length > 0 || inStockOnly || minPrice || maxPrice) && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 font-bold transition-colors">
                Search
              </button>
            </form>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-5 gap-6 animate-in slide-in-from-top-2">
                {/* Supplier (Single Select still okay?) Yes, kept simple for now */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Supplier</label>
                  <select
                    className="w-full p-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Brand (Mega Filter) */}
                <div>
                  <MegaFilterDropdown
                    label="Brand"
                    options={brands}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    placeholder="All Brands"
                  />
                </div>

                {/* Category (Mega Filter) */}
                <div>
                  <MegaFilterDropdown
                    label="Category"
                    options={categories}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="All Categories"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Price (R)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full p-2 rounded border border-gray-200 text-sm"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full p-2 rounded border border-gray-200 text-sm"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Sort & Availability</label>
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 rounded border border-gray-200 text-sm"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="newest">Newest Arrivals</option>
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={e => setInStockOnly(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 pb-12">

        {/* Search Results View */}
        {hasSearched ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Results
                {query && <span> for "{query}"</span>}
                <span className="text-gray-400 text-sm font-normal ml-2">({totalResults} found)</span>
              </h3>
              <button onClick={clearSearch} className="text-sm text-gray-500 hover:text-red-500">Clear Search</button>
            </div>

            {loading && <div className="text-center py-12 text-gray-500">Searching...</div>}

            {!loading && results.length === 0 && (
              <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-dashed text-gray-500">No products found for your filters.</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <div key={product.id} className="group bg-white rounded-xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-center h-48">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-gray-300 text-xs">No Image</span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 lg:text-base">{product.name}</h4>
                    <div className="flex gap-2 mb-3">
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded border">{product.brand}</span>
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded border border-indigo-100">{product.supplier_name}</span>
                    </div>

                    <div className="mt-auto pt-3 border-t flex items-end justify-between">
                      <div>
                        <div className="mb-4">
                          <p className="text-xl font-bold text-blue-700">R {calculatePrice(product.price_ex_vat).exVat}</p>
                          <p className="text-xs text-gray-400 font-medium">EX VAT</p>
                          <p className="text-sm font-semibold text-gray-600 mt-1">R {calculatePrice(product.price_ex_vat).incVat}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">INC VAT</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-[10px] px-2 py-1 rounded font-medium ${product.qty_on_hand > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {product.qty_on_hand > 0 ? `${product.qty_on_hand} Stock` : 'No Stock'}
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add to Quote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {results.length < totalResults && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-10 border rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span>Load More Results</span>
                      <span className="text-gray-400 text-sm font-normal">({totalResults - results.length} remaining)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Featured / Landing View */
          <div className="space-y-12 animate-in fade-in duration-700 delay-100">
            {suppliers.filter(s => featured[s.name] && featured[s.name].length > 0).map(supplier => (
              <div key={supplier.slug} className="">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    {supplier.name}
                    <span className="text-sm font-normal text-gray-400 ml-2">Latest Arrivals</span>
                  </h3>
                </div>

                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                  {featured[supplier.name].map(product => (
                    <div key={product.id} className="snap-start flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer p-4 flex flex-col">
                      <div className="h-40 bg-gray-50 rounded-lg mb-4 flex items-center justify-center p-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-gray-300 text-xs">No Image</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1" title={product.name}>{product.name}</h4>
                        <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                        <div className="mt-auto pt-2 border-t flex justify-between items-end">
                          <div>
                            <div className="mb-1">
                              <p className="font-bold text-lg text-blue-700 leading-tight">R {calculatePrice(product.price_ex_vat).exVat}</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase">EX VAT</p>
                              <p className="font-semibold text-sm text-gray-600 mt-0.5 leading-tight">R {calculatePrice(product.price_ex_vat).incVat}</p>
                              <p className="text-[10px] text-gray-400 font-medium uppercase">INC VAT</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`w-2 h-2 rounded-full ${product.qty_on_hand > 0 ? 'bg-green-500' : 'bg-red-400'}`}></span>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg shadow-sm transition-all active:scale-90"
                              title="Add to Quote"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        updateQuantity={updateCartQuantity}
        removeItem={removeCartItem}
        isAccount={isAccount}
      />
    </main>
  );
}
