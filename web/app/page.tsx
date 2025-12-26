'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MegaFilterDropdown from './components/MegaFilterDropdown';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import ComparisonModal from './components/ComparisonModal';
import { Product, Supplier, CartItem, UserRole } from './types';

// Pricing logic: Guest = +15%, Account = Raw Price
export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [guestMarkup, setGuestMarkup] = useState(15);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Comparison State
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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
    // Load user role from localStorage
    const savedRole = localStorage.getItem('whosgotstock_user_role');
    if (savedRole && ['public', 'staff', 'manager'].includes(savedRole)) {
      setUserRole(savedRole as UserRole);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('whosgotstock_cart', JSON.stringify(cart));
  }, [cart]);

  // Save user role to localStorage
  useEffect(() => {
    localStorage.setItem('whosgotstock_user_role', userRole);
  }, [userRole]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        ...product,
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

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string, overrideSupplier?: string) => {
    if (e) e.preventDefault();

    const currentQuery = overrideQuery !== undefined ? overrideQuery : query;
    const currentSupplier = overrideSupplier !== undefined ? overrideSupplier : selectedSupplier;

    // Allow search if params exist even if query is empty
    if (!currentQuery && !currentSupplier && selectedBrands.length === 0 && selectedCategories.length === 0) {
      if (!hasSearched) return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (currentQuery) params.append('q', currentQuery);
      if (currentSupplier) params.append('supplier', currentSupplier);
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
    const raw = parseFloat(basePrice);

    // Higher markup for public, lower for staff/managers
    let markup = guestMarkup; // Default 15%
    if (userRole === 'staff') markup = 10;
    if (userRole === 'manager') markup = 5;

    const markedUp = raw * (1 + (markup / 100));
    const withVat = markedUp * 1.15; // 15% VAT

    return {
      exVat: markedUp.toFixed(2),
      incVat: withVat.toFixed(2)
    };
  };

  const handleRoleSwitch = () => {
    if (userRole !== 'public') {
      setUserRole('public');
      return;
    }
    setShowRoleModal(true);
  };

  const verifyPassphrase = () => {
    // Get passphrases from environment variables
    const staffPassphrase = process.env.NEXT_PUBLIC_STAFF_PASSPHRASE || 'Smart@staff2024!';
    const managerPassphrase = process.env.NEXT_PUBLIC_MANAGER_PASSPHRASE || 'Smart@managers2024!';
    
    if (passphrase === staffPassphrase) {
      setUserRole('staff');
      setShowRoleModal(false);
      setPassphrase('');
      setPassphraseError('');
    } else if (passphrase === managerPassphrase) {
      setUserRole('manager');
      setShowRoleModal(false);
      setPassphrase('');
      setPassphraseError('');
    } else {
      setPassphraseError('Invalid passphrase');
    }
  };

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 4) return prev; // Limit to 4
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId: number) => {
    setCompareList(prev => prev.filter(item => item.id !== productId));
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
      <div className="absolute top-0 w-full p-4 sm:p-6 flex justify-between items-center z-50 gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 cursor-pointer hover:opacity-80 transition-opacity" onClick={clearSearch}>
            WhosGotStock
          </h1>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex-shrink-0 p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 transition-all bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-sm border border-white/50 hover:shadow-md active:scale-95"
            title="View Quote Cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-pink-600 text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <div
            onClick={handleRoleSwitch}
            className={`flex-shrink-0 flex items-center space-x-2 bg-white/70 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] shadow-sm border border-white/50 cursor-pointer hover:shadow-md transition-all ${userRole !== 'public' ? 'ring-2 ring-blue-100' : ''}`}
          >
            <span className="font-bold text-gray-800 capitalize truncate max-w-[50px] sm:max-w-none">{userRole}</span>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userRole === 'public' ? 'bg-gray-300' : userRole === 'staff' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          </div>

          {userRole === 'manager' && (
            <Link href="/admin" className="flex-shrink-0 text-[11px] sm:text-sm font-bold text-gray-500 hover:text-blue-600 px-3 sm:px-4 py-1.5 bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow-md">Admin</Link>
          )}
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
                    className="w-full p-2 rounded border border-gray-200 text-sm"
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
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                        className={`p-2 rounded-full backdrop-blur shadow-sm transition-all border ${compareList.find(p => p.id === product.id)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white/80 text-gray-400 border-gray-100 hover:text-blue-600'
                          }`}
                        title="Add to Compare"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">{product.name}</h4>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                        {userRole === 'public' ? 'Verified Stock' : product.supplier_name}
                      </span>
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
          /* Modern Discovery / Landing View */
          <div className="max-w-7xl mx-auto px-6 py-16 space-y-32 animate-in fade-in duration-700 delay-100">

            {/* Value Proposition & About Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                  The Ultimate IT Sourcing Engine
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight">
                  One Search. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    10,000+ Products.
                  </span>
                </h3>
                <div className="space-y-4 text-gray-500 text-lg font-medium leading-relaxed max-w-xl">
                  <p>
                    WhosGotStock is built to streamline the way you source IT hardware in South Africa. We aggregate live inventory from the nation's biggest distributors into a single, lightning-fast interface.
                  </p>
                  <p className="text-sm">
                    Stop opening 10 browser tabs. Compare pricing across suppliers, verify real-time stock levels, and generate professional quote templates in seconds.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-black text-gray-900">10,000+</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Items</p>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-black text-gray-900">Live</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Feeds</p>
                  </div>
                  <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-black text-gray-900">4+</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Suppliers</p>
                  </div>
                </div>
              </div>

              {/* Discovery Tiles Grid (Icons) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Notebooks', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                  { label: 'Networking', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.345 8.99c5.287-5.288 13.854-5.288 19.141 0" /></svg> },
                  { label: 'Servers', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg> },
                  { label: 'Storage', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg> },
                  { label: 'Security', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
                  { label: 'Components', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg> },
                ].map((tile, i) => (
                  <div
                    key={i}
                    onClick={() => { setQuery(tile.label); handleSearch(undefined, tile.label); }}
                    className="aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center p-4 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="text-gray-300 group-hover:text-blue-600 transition-colors mb-4 scale-125">
                      {tile.icon}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{tile.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Sourcing Section */}
            <div className="space-y-12">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Source Direct.</h3>
                <p className="text-gray-500 font-medium">Why buy through middlemen when you can source direct from SA's largest distributors? Search live inventory across these master suppliers.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {suppliers.map(s => (
                  <div
                    key={s.slug}
                    onClick={() => { setSelectedSupplier(s.slug); handleSearch(undefined, undefined, s.slug); }}
                    className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col items-center text-center space-y-6"
                  >
                    <div className="h-20 w-20 bg-gray-50 rounded-3xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <span className="text-2xl font-black text-gray-200 group-hover:text-blue-600 transition-colors">
                        {s.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900 mb-1">{s.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Master Supplier</p>
                    </div>
                    <div className="pt-2">
                      <span className="text-xs font-bold text-blue-600 px-4 py-2 bg-blue-50/50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                        View Inventory
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands Carousel Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Explore Top Brands</h4>
                <div className="h-px flex-1 bg-gray-100 mx-8"></div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                {['HP', 'Dell', 'Lenovo', 'Cisco', 'MikroTik', 'Ubiquiti', 'TP-Link', 'Seagate', 'Western Digital'].map(brand => (
                  <span
                    key={brand}
                    onClick={() => { setQuery(brand); handleSearch(undefined, brand); }}
                    className="text-xl md:text-2xl font-black text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {brand.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        updateQuantity={updateCartQuantity}
        removeItem={removeCartItem}
        userRole={userRole}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onToggleCompare={toggleCompare}
        isInCompare={!!selectedProduct && !!compareList.find(p => p.id === selectedProduct.id)}
        calculatePrice={calculatePrice}
        userRole={userRole}
      />

      {/* Role Passphrase Modal */}
      {
        showRoleModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black text-gray-900 mb-2">Elevated Access</h3>
              <p className="text-sm text-gray-500 mb-6">Enter passphrase to unlock staff or manager pricing tiers.</p>

              <div className="space-y-4">
                <input
                  type="password"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder="Passphrase"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                  onKeyDown={e => e.key === 'Enter' && verifyPassphrase()}
                  autoFocus
                />
                {passphraseError && <p className="text-xs font-bold text-red-500">{passphraseError}</p>}

                <button
                  onClick={verifyPassphrase}
                  className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  Unlock Access
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Floating Compare Bar */}
      {
        compareList.length > 0 && (
          <div className="fixed bottom-6 sm:bottom-8 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[150] animate-in slide-in-from-bottom-10 duration-500 max-w-lg sm:mx-auto">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] p-2 sm:p-3 flex items-center justify-between gap-2 sm:gap-6 sm:pr-6">
              <div className="flex -space-x-4 pl-1 sm:pl-3 overflow-hidden">
                {compareList.map(p => (
                  <div key={p.id} className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl border-2 border-gray-50 shadow-sm flex items-center justify-center p-2 relative group flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="w-4 h-4 bg-gray-100 rounded-full" />
                    )}
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl sm:rounded-2xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                {compareList.length < 4 && Array.from({ length: 4 - compareList.length }).map((_, i) => (
                  <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-dashed border-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-100 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block h-10 w-px bg-gray-100" />

              <div className="flex flex-col flex-1 sm:flex-none">
                <p className="text-[10px] sm:text-xs font-black text-gray-900 uppercase tracking-widest">{compareList.length} Selected</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400">Comparison</p>
              </div>

              <button
                onClick={() => setIsCompareModalOpen(true)}
                disabled={compareList.length < 2}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-4 sm:px-8 py-3 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-2"
              >
                <span className="hidden sm:inline">Compare</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )
      }

      <ComparisonModal
        products={compareList}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onRemove={removeFromCompare}
        onAddToCart={addToCart}
        formatPrice={formatPrice}
        calculatePrice={calculatePrice}
        userRole={userRole}
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
