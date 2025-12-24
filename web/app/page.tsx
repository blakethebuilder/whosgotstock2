'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MegaFilterDropdown from './components/MegaFilterDropdown';
import CartDrawer, { CartItem } from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';

// Pricing logic: Guest = +15%, Account = Raw Price
interface Product {
  id: number;
  name: string;
  brand: string;
  price_ex_vat: string;
  qty_on_hand: number;
  supplier_sku: string;
  supplier_name: string;
  image_url: string;
  category: string;
  raw_data: string;
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
  const [guestMarkup, setGuestMarkup] = useState(15);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const formatPrice = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculatePrice = (basePrice: string) => {
    const price = parseFloat(basePrice);
    const markupFactor = 1 + (guestMarkup / 100);
    const markedUp = isAccount ? price : price * markupFactor;
    const withVat = markedUp * 1.15;

    return {
      exVat: markedUp.toFixed(2),
      incVat: withVat.toFixed(2)
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
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbarish Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-pointer hover:opacity-80 transition-opacity" onClick={clearSearch}>
            WhosGotStock
          </h1>
        </div>
        <div className="flex gap-4 items-center pointer-events-auto">
          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 text-gray-600 hover:text-blue-600 transition-all bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 hover:shadow-md hover:scale-105"
            title="View Quote Cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-pink-600 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[13px] shadow-sm border border-white/50">
            <span className={!isAccount ? "font-bold text-gray-800" : "text-gray-400 font-medium"}>Guest</span>
            <button
              onClick={() => setIsAccount(!isAccount)}
              className={"w-11 h-6 rounded-full p-1 transition-all duration-300 " + (isAccount ? "bg-indigo-600 shadow-inner" : "bg-gray-200")}
            >
              <div className={"bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 " + (isAccount ? "translate-x-5" : "")}></div>
            </button>
            <span className={isAccount ? "font-bold text-gray-800" : "text-gray-400 font-medium"}>Account</span>
          </div>
          <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-blue-600 px-4 py-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow-md">Admin</Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`transition-all duration-700 ease-in-out relative overflow-hidden ${hasSearched ? 'pt-28 pb-10 min-h-[auto]' : 'h-[75vh] min-h-[600px] flex flex-col justify-center items-center'}`}>
        {/* Animated Background Blobs (Premium Touch) */}
        {!hasSearched && (
          <>
            <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_100%)] z-0" />
          </>
        )}

        <div className={`w-full max-w-5xl px-4 mx-auto relative z-10 ${hasSearched ? '' : 'text-center'}`}>
          {!hasSearched && (
            <div className="space-y-4 mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-100 shadow-sm">
                The Ultimate IT Sourcing Engine
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Find Stock, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Instantly.</span>
              </h2>
              <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
                Aggregating stock from South Africa's leading IT suppliers into one seamless interface.
              </p>
            </div>
          )}

          <div className={`bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl transition-all duration-500 relative overflow-hidden border border-white/50 ${hasSearched ? 'ring-1 ring-gray-200' : 'scale-105 hover:scale-[1.06]'}`}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center w-full">
              <div className="flex items-center flex-1">
                <div className="pl-6 text-blue-500 hidden sm:block">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  className="flex-1 p-5 text-lg sm:text-xl bg-transparent focus:outline-none min-w-0 font-medium placeholder-gray-400"
                  placeholder="Search 10,000+ products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex border-t sm:border-t-0 sm:border-l border-gray-100 bg-white/50">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-none py-5 px-6 text-sm font-bold hover:bg-white transition-all flex items-center justify-center gap-2 ${showFilters ? 'text-blue-600 bg-white' : 'text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  <span>Filters</span>
                  {(selectedBrands.length > 0 || selectedSupplier || selectedCategories.length > 0 || inStockOnly || minPrice || maxPrice) &&
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  }
                </button>
                <button type="submit" className="flex-1 sm:flex-none bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-10 py-5 font-black text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-200">
                  Search
                </button>
              </div>
            </form>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <div className="p-8 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-8 animate-in slide-in-from-top-4 duration-300">
                {/* Supplier (Single Select still okay?) Yes, kept simple for now */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Supplier</label>
                  <select
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
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98]"
                >
                  <div className="p-6 bg-gray-50/50 flex items-center justify-center h-52 relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/80 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-600 border border-blue-50 tracking-wider uppercase">{product.brand}</span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">{product.name}</h4>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">{product.supplier_name}</span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                      <div>
                        <div className="mb-1">
                          <p className="text-xl font-black text-gray-900 leading-tight">R {formatPrice(calculatePrice(product.price_ex_vat).exVat)}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Excluding VAT</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-500 leading-tight">R {formatPrice(calculatePrice(product.price_ex_vat).incVat)}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Including VAT</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${product.qty_on_hand > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {product.qty_on_hand > 0 ? `${product.qty_on_hand} Stock` : 'No Stock'}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-90"
                        >
                          + Quote
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
          <div className="max-w-7xl mx-auto px-4 py-20 space-y-24 animate-in fade-in duration-700 delay-100">
            {suppliers.filter(s => featured[s.name] && featured[s.name].length > 0).map(supplier => (
              <div key={supplier.slug} className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                    <span className="w-2.5 h-10 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
                    {supplier.name}
                    <span className="text-sm font-bold text-gray-400 ml-2 uppercase tracking-widest">New Arrivals</span>
                  </h3>
                </div>

                {/* Horizontal Scroll Container */}
                <div className="flex overflow-x-auto pb-10 gap-6 scrollbar-hide snap-x px-4 -mx-4">
                  {featured[supplier.name].map(product => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="snap-start flex-shrink-0 w-80 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer p-6 flex flex-col group active:scale-[0.97]"
                    >
                      <div className="h-52 bg-gray-50/50 rounded-[1.5rem] mb-6 flex items-center justify-center p-6 relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-110 duration-700" />
                        ) : (
                          <div className="text-gray-200">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 border border-blue-50 tracking-wider uppercase shadow-sm">{product.brand}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base line-clamp-2 mb-6 group-hover:text-blue-600 transition-colors leading-snug">{product.name}</h4>
                      <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                        <div>
                          <p className="text-xl font-black text-gray-900 leading-none">R {formatPrice(calculatePrice(product.price_ex_vat).exVat)}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Excl. VAT</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-90"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </button>
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

      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        calculatePrice={calculatePrice}
        isAccount={isAccount}
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
