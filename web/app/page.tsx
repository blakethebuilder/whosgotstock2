'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CategoryTiles from './components/CategoryTiles';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import ComparisonModal from './components/ComparisonModal';
import { Product, Supplier, CartItem, UserRole, UsageStats } from './types';
import { debounce } from '@/lib/debounce';
import { calculatePrice, formatPrice, PricingSettings } from '@/lib/pricing';

// Pricing logic: Free = +15%, Professional = +8%, Enterprise = +5%, Partner = Cost
export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>('free');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Mobile input focus fix
  useEffect(() => {
    if (showRoleModal) {
      // Small delay to ensure modal is rendered before focusing
      const timer = setTimeout(() => {
        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (input) {
          input.focus();
          // Scroll to input on mobile
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showRoleModal]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    searchesThisMonth: 0,
    searchLimit: 25, // Updated to 25 for free tier
    quotesGenerated: 0,
    isLimitReached: false
  });

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pricing settings from database
  const [pricingSettings, setPricingSettings] = useState({
    free_markup: 15,
    professional_markup: 5, // Changed to 5% handling fee
    enterprise_markup: 0,   // No markup for Enterprise
    staff_markup: 10,       // Smart Integrate staff tier
    partner_markup: 0       // Cost pricing for admin
  });

  // Comparison State
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Filters
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filter States
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const [showFilters, setShowFilters] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => {
    // Load suppliers and pricing settings
    Promise.all([
      fetch('/api/suppliers').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/user/usage').then(r => r.json()).catch(() => ({ searchesThisMonth: 0, searchLimit: 25, quotesGenerated: 0, isLimitReached: false }))
    ]).then(([suppliersData, settingsData, usageData]) => {
      if (Array.isArray(suppliersData)) setSuppliers(suppliersData);
      if (settingsData) {
        setPricingSettings({
          free_markup: parseInt(settingsData.free_markup || '15'),
          professional_markup: parseInt(settingsData.professional_markup || '5'),
          enterprise_markup: parseInt(settingsData.enterprise_markup || '0'),
          staff_markup: parseInt(settingsData.staff_markup || '10'),
          partner_markup: parseInt(settingsData.partner_markup || '0')
        });
      }
      if (usageData) {
        setUsageStats(usageData);
      }
    }).catch(console.error);
  }, []);

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
    if (savedRole && ['free', 'professional', 'enterprise', 'staff', 'partner'].includes(savedRole)) {
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

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchSupplier?: string) => {
      if (!searchQuery && !searchSupplier) {
        return;
      }
      performSearch(searchQuery, searchSupplier);
    }, 300),
    [selectedSupplier, minPrice, maxPrice, inStockOnly, sortBy]
  );

  const performSearch = async (searchQuery?: string, searchSupplier?: string) => {
    const currentQuery = searchQuery !== undefined ? searchQuery : query;
    const currentSupplier = searchSupplier !== undefined ? searchSupplier : selectedSupplier;

    // Check usage limits for free tier
    if (userRole === 'free' && usageStats.isLimitReached) {
      alert('You\'ve reached your monthly search limit. Upgrade to Professional for unlimited searches!');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (currentQuery) params.append('q', currentQuery);
      if (currentSupplier) params.append('supplier', currentSupplier);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setPage(1);

      // Track usage for free tier
      if (userRole === 'free') {
        const newSearchCount = usageStats.searchesThisMonth + 1;
        setUsageStats(prev => ({
          ...prev,
          searchesThisMonth: newSearchCount,
          isLimitReached: newSearchCount >= prev.searchLimit
        }));
        
        // Track usage on server
        fetch('/api/user/track-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search' })
        }).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string, overrideSupplier?: string) => {
    if (e) e.preventDefault();
    const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
    const searchSupplier = overrideSupplier !== undefined ? overrideSupplier : selectedSupplier;
    performSearch(searchQuery, searchSupplier);
  };

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (query.length > 2 || query.length === 0) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);

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

  const formatPriceDisplay = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculatePriceWithDiscount = (basePrice: string) => {
    const price = calculatePrice(basePrice, userRole, pricingSettings);
    
    // Calculate discount information for paid tiers
    const freePrice = calculatePrice(basePrice, 'free', pricingSettings);
    const discount = userRole !== 'free' ? parseFloat(freePrice.exVat) - parseFloat(price.exVat) : 0;
    const discountPercentage = userRole !== 'free' ? 
      (discount / parseFloat(freePrice.exVat) * 100) : 0;

    return {
      ...price,
      originalPrice: freePrice.exVat,
      discount: discount.toFixed(2),
      discountPercentage: discountPercentage.toFixed(1),
      hasDiscount: userRole !== 'free' && discount > 0
    };
  };

  const handleRoleSwitch = () => {
    if (userRole !== 'free') {
      setUserRole('free');
      return;
    }
    setShowRoleModal(true);
  };

  const verifyPassphrase = async () => {
    setPassphraseError('');
    setIsAuthenticating(true);
    
    // Try each role until we find a match
    const roles = ['professional', 'enterprise', 'staff', 'partner'];
    
    for (const role of roles) {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passphrase, role })
        });
        
        const data = await response.json();
        if (data.success) {
          setUserRole(data.role as UserRole);
          setShowRoleModal(false);
          setPassphrase('');
          setPassphraseError('');
          setIsAuthenticating(false);
          return;
        }
      } catch (error) {
        console.error('Auth error for role', role, error);
      }
    }
    
    // If we get here, no role matched
    setPassphraseError('Invalid passphrase');
    setIsAuthenticating(false);
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
    setSelectedSupplier('');
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
            className={`flex-shrink-0 flex items-center space-x-2 bg-white/70 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] shadow-sm border border-white/50 cursor-pointer hover:shadow-md transition-all ${userRole !== 'free' ? 'ring-2 ring-blue-100' : ''}`}
          >
            <span className="font-bold text-gray-800 capitalize truncate max-w-[50px] sm:max-w-none">
              {userRole === 'free' ? 'Free' : userRole === 'professional' ? 'Pro' : userRole === 'enterprise' ? 'Enterprise' : userRole === 'staff' ? 'Staff' : 'Partner'}
            </span>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userRole === 'free' ? 'bg-gray-300' : userRole === 'professional' ? 'bg-blue-500' : userRole === 'enterprise' ? 'bg-purple-500' : userRole === 'staff' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
            {userRole === 'free' && (
              <span className="text-[9px] text-gray-500 hidden sm:inline">
                {usageStats.searchesThisMonth}/{usageStats.searchLimit}
              </span>
            )}
          </div>

          {(userRole === 'enterprise' || userRole === 'staff' || userRole === 'partner') && (
            <Link href="/admin" className="flex-shrink-0 text-[11px] sm:text-sm font-bold text-gray-500 hover:text-blue-600 px-3 sm:px-4 py-1.5 bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/50 shadow-sm transition-all hover:shadow-md">Admin</Link>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className={`transition-all duration-700 ease-in-out relative overflow-hidden ${hasSearched ? 'pt-24 pb-8 min-h-[auto]' : 'min-h-[85vh] flex flex-col justify-center items-center'}`}>
        {/* Animated Background Blobs (Premium Touch) */}
        {!hasSearched && (
          <>
            <div className="absolute top-[15%] left-[8%] w-80 h-80 bg-blue-400/15 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[15%] right-[8%] w-96 h-96 bg-purple-400/10 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_100%)] z-0" />
          </>
        )}

        <div className={`w-full max-w-4xl px-6 mx-auto relative z-10 ${hasSearched ? '' : 'text-center'}`}>
          {!hasSearched && (
            <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-widest uppercase border border-blue-100 shadow-sm">
                For IT Companies & MSPs
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight">
                Find Stock, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Instantly.</span>
              </h2>
              <p className="text-gray-500 text-xl sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Built specifically for IT companies and MSPs. Compare pricing and stock levels across Scoop, Esquire, Pinnacle, Mustek, and Miro. One search, all suppliers, instant results.
              </p>
            </div>
          )}

          <div className={`bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl transition-all duration-500 relative overflow-hidden border border-white/60 ${hasSearched ? 'ring-1 ring-gray-200' : 'hover:shadow-3xl'}`}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center w-full">
              <div className="flex items-center flex-1">
                <div className="pl-8 text-blue-500 hidden sm:block">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  className="flex-1 p-6 text-xl sm:text-2xl bg-transparent focus:outline-none min-w-0 font-medium placeholder-gray-400"
                  placeholder="Search 15,000+ IT products instantly..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex border-t sm:border-t-0 sm:border-l border-gray-100 bg-white/60">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-none py-6 px-8 text-sm font-bold hover:bg-white transition-all flex items-center justify-center gap-2 ${showFilters ? 'text-blue-600 bg-white' : 'text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  <span>Filters</span>
                  {(selectedSupplier || inStockOnly || minPrice || maxPrice) &&
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  }
                </button>
                <button type="submit" className="flex-1 sm:flex-none bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-12 py-6 font-black text-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-200">
                  Search
                </button>
              </div>
            </form>

            {/* Simplified Filters Panel */}
            {showFilters && (
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                
                {/* Supplier Filter */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                    className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Price Range (R)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Sort By</label>
                  <select
                    className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Stock & Quick Actions */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Options</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={e => setInStockOnly(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                    
                    {/* Clear Filters Button */}
                    {(selectedSupplier || minPrice || maxPrice || inStockOnly || sortBy !== 'relevance') && (
                      <button
                        onClick={() => {
                          setSelectedSupplier('');
                          setMinPrice('');
                          setMaxPrice('');
                          setInStockOnly(false);
                          setSortBy('relevance');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Usage Warning for Free Tier */}
        {userRole === 'free' && usageStats.searchesThisMonth >= usageStats.searchLimit * 0.8 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-amber-800">
                    {usageStats.isLimitReached ? 'Search limit reached!' : `${usageStats.searchLimit - usageStats.searchesThisMonth} searches remaining`}
                  </p>
                  <p className="text-sm text-amber-700">
                    {usageStats.isLimitReached ? 'Upgrade to continue searching' : 'Upgrade for unlimited searches and better pricing'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoleModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
        {/* Category Tiles - Show when not searching */}
        {!hasSearched && (
          <div className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {/* Hero Value Proposition */}
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-blue-100">
                Powered by AI Technology
              </div>
              <h3 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                Stop Juggling Supplier Websites. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Source Smarter.
                </span>
              </h3>
              <div className="text-gray-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-10">
                <p className="mb-4">
                  Built specifically for IT companies and MSPs who need to compare pricing and stock levels across 
                  Scoop, Esquire, Pinnacle, Mustek, and Miro. One search, all suppliers, instant results.
                </p>
                <p className="text-base">
                  Generate professional quotes in seconds. Connect with Smart Integrate for procurement, 
                  or use staff/manager portals for direct supplier orders.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border border-blue-100 shadow-sm">
                  <p className="text-2xl font-black text-blue-600">15,000+</p>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">Live Products</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-4 rounded-2xl border border-green-100 shadow-sm">
                  <p className="text-2xl font-black text-green-600">Real-Time</p>
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Stock Updates</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 px-6 py-4 rounded-2xl border border-purple-100 shadow-sm">
                  <p className="text-2xl font-black text-purple-600">5+</p>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">Major Suppliers</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-4 rounded-2xl border border-orange-100 shadow-sm">
                  <p className="text-2xl font-black text-orange-600">Instant</p>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Price Quotes</p>
                </div>
              </div>
            </div>

            {/* Popular Categories */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
                  Popular Categories
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
                  What are you looking for?
                </h3>
                <p className="text-gray-500 text-base">
                  Click a category to search thousands of products instantly
                </p>
              </div>

              <CategoryTiles 
                onCategoryClick={(searchTerm) => {
                  setQuery(searchTerm);
                  performSearch(searchTerm);
                }}
              />
            </div>

            {/* Popular Brands */}
            <div className="mb-16">
              <div className="text-center mb-8">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Explore Top Brands</h4>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 opacity-60 hover:opacity-100 transition-all duration-700">
                {[
                  'HP', 'Dell', 'Lenovo', 'Cisco', 'MikroTik', 'Ubiquiti', 'TP-Link', 
                  'Seagate', 'Western Digital', 'Intel', 'AMD', 'NVIDIA', 'ASUS', 
                  'MSI', 'Gigabyte', 'Samsung', 'Kingston', 'Corsair', 'Logitech', 
                  'Microsoft', 'Apple', 'Canon', 'Epson', 'Brother'
                ].map(brand => (
                  <span
                    key={brand}
                    onClick={() => { setQuery(brand); performSearch(brand); }}
                    className="text-lg md:text-xl font-black text-gray-400 cursor-pointer hover:text-blue-600 transition-colors px-3 py-2 rounded hover:bg-blue-50"
                  >
                    {brand.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Professional Footer with Disclaimer */}
            <div className="text-center space-y-6 py-16 border-t border-gray-100">
              {/* Main Value Proposition */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                  Built for <span className="text-blue-600">IT Companies</span> & <span className="text-indigo-600">MSPs</span>
                </h3>
                <div className="max-w-4xl mx-auto text-gray-600 leading-relaxed space-y-4">
                  <p className="text-base font-medium">
                    Are you an IT company or Managed Service Provider constantly comparing prices across multiple suppliers? 
                    Tired of checking stock levels on Scoop, Esquire, Pinnacle, Mustek, and Miro separately?
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-800">WhosGotStock was born to solve this exact problem.</strong> This sourcing tool aggregates live inventory and pricing 
                    from South Africa's major IT distributors into one powerful search interface, saving you hours of manual comparison work.
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-2">🏢 For IT Companies & MSPs</h4>
                    <p className="text-blue-700">
                      Generate professional quotes instantly. Our quote tool connects with Smart Integrate for procurement assistance, 
                      or staff/manager portals can generate direct supplier orders.
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="font-bold text-amber-800 mb-2">⚠️ Not an E-commerce Store</h4>
                    <p className="text-amber-700">
                      We're a sourcing tool, not a retailer. We help you find and compare products, 
                      then facilitate orders through established supplier relationships.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Network */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">Integrated Suppliers</h4>
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-gray-500">
                  {[
                    'Scoop', 'Esquire', 'Pinnacle', 'Mustek', 'Miro'
                  ].map(supplier => (
                    <span
                      key={supplier}
                      className="text-base font-bold text-gray-500 px-3 py-1 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      {supplier}
                    </span>
                  ))}
                  <span className="text-sm text-blue-600 font-medium italic">+ more suppliers coming soon</span>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="max-w-4xl mx-auto pt-6 border-t border-gray-100">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Important Disclaimer</h4>
                  <div className="text-xs text-gray-600 leading-relaxed space-y-2">
                    <p>
                      <strong>WhosGotStock is a sourcing tool, not a retailer.</strong> We aggregate product information from supplier feeds 
                      and cannot be held liable for pricing errors, stock discrepancies, or outdated information provided by suppliers.
                    </p>
                    <p>
                      All pricing and availability information is sourced directly from supplier systems and may not reflect real-time accuracy. 
                      Final pricing, availability, and terms are subject to confirmation with the respective suppliers.
                    </p>
                    <p>
                      This platform is designed to assist IT professionals in product sourcing and comparison. 
                      Always verify critical information directly with suppliers before making purchasing decisions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Powered By */}
              <div className="pt-4">
                <p className="text-xs text-gray-400 font-medium">
                  Powered by advanced AI technology • Built for the South African IT industry
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Search Results View */}
        {hasSearched && (
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
              <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-dashed text-gray-500">
                No products found for your filters.
                {userRole === 'free' && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-3">
                      Upgrade to Professional for access to more suppliers and better search results
                    </p>
                    <button
                      onClick={() => setShowRoleModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((product, index) => (
                <div key={product.id}>
                  <div
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
                          {userRole === 'free' ? 'Verified Stock' : product.supplier_name}
                        </span>
                        {userRole === 'free' && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                            Upgrade for supplier details
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-end justify-between">
                        <div>
                          {calculatePriceWithDiscount(product.price_ex_vat).hasDiscount && (
                            <div className="mb-2">
                              <p className="text-xs line-through text-gray-400">R {formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).originalPrice)}</p>
                              <p className="text-xs font-bold text-green-600">Save R {formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).discount)} ({calculatePriceWithDiscount(product.price_ex_vat).discountPercentage}% off)</p>
                            </div>
                          )}
                          <div className="mb-1">
                            <p className="text-xl font-black text-gray-900 leading-tight">R {formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).exVat)}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Excluding VAT</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-500 leading-tight">R {formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).incVat)}</p>
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

                  {/* Upgrade Prompt every 10 results for free users */}
                  {userRole === 'free' && (index + 1) % 10 === 0 && index < results.length - 1 && (
                    <div className="col-span-full my-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 text-center">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                          Unlock Better Pricing
                        </h3>
                        <p className="text-sm text-blue-700 mb-4">
                          Professional users save an average of R500 per quote with better pricing and supplier access
                        </p>
                        <button
                          onClick={() => setShowRoleModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                          Upgrade to Professional - R399/month
                        </button>
                      </div>
                    </div>
                  )}
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
        )}
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        updateQuantity={updateCartQuantity}
        removeItem={removeCartItem}
        userRole={userRole}
        pricingSettings={pricingSettings}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onToggleCompare={toggleCompare}
        isInCompare={!!selectedProduct && !!compareList.find(p => p.id === selectedProduct.id)}
        calculatePrice={(basePrice: string) => calculatePrice(basePrice, userRole, pricingSettings)}
        userRole={userRole}
      />

      {/* Role Passphrase Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-8 max-w-2xl w-full animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">Upgrade Your Access</h3>
              <p className="text-sm text-gray-500">Choose a plan that fits your business needs</p>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
              {/* Professional */}
              <div className="border-2 border-blue-200 rounded-2xl p-4 sm:p-6 bg-blue-50/50">
                <div className="text-center mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-bold text-blue-900">Professional</h4>
                  <p className="text-xl sm:text-2xl font-black text-blue-600">R399<span className="text-sm font-normal">/month</span></p>
                  <p className="text-xs text-blue-700">5% handling fee • Unlimited searches</p>
                </div>
                <ul className="text-xs text-blue-800 space-y-1 sm:space-y-2 mb-4">
                  <li>✓ Unlimited searches</li>
                  <li>✓ Professional quotes</li>
                  <li>✓ Supplier contact info</li>
                  <li>✓ Email support</li>
                </ul>
              </div>

              {/* Enterprise */}
              <div className="border-2 border-purple-200 rounded-2xl p-4 sm:p-6 bg-purple-50/50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Most Popular
                </div>
                <div className="text-center mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-bold text-purple-900">Enterprise</h4>
                  <p className="text-xl sm:text-2xl font-black text-purple-600">R1599<span className="text-sm font-normal">/month</span></p>
                  <p className="text-xs text-purple-700">No markup • White labeled</p>
                </div>
                <ul className="text-xs text-purple-800 space-y-1 sm:space-y-2 mb-4">
                  <li>✓ Everything in Professional</li>
                  <li>✓ Multi-user accounts (10 users)</li>
                  <li>✓ White label solution</li>
                  <li>✓ Custom branding</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              {/* Free Tier Info */}
              <div className="border-2 border-gray-200 rounded-2xl p-4 sm:p-6 bg-gray-50/50">
                <div className="text-center mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900">Free</h4>
                  <p className="text-xl sm:text-2xl font-black text-gray-600">R0<span className="text-sm font-normal">/month</span></p>
                  <p className="text-xs text-gray-700">25 searches • 15% markup</p>
                </div>
                <ul className="text-xs text-gray-800 space-y-1 sm:space-y-2 mb-4">
                  <li>✓ 25 searches per month</li>
                  <li>✓ Basic product information</li>
                  <li>✓ Watermarked quotes</li>
                  <li>✓ Community support</li>
                </ul>
              </div>
            </div>

            {/* Temporary Access - Always Visible */}
            <div className="border-t pt-4 sm:pt-6 bg-white sticky bottom-0">
              <p className="text-sm text-gray-600 mb-4 text-center font-medium">
                Have a passphrase for temporary access?
              </p>
              <div className="space-y-4">
                <input
                  type="password"
                  value={passphrase}
                  onChange={e => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase"
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-center text-base bg-white shadow-sm"
                  onKeyDown={e => e.key === 'Enter' && verifyPassphrase()}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                />
                {passphraseError && <p className="text-xs font-bold text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">{passphraseError}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    Continue Free
                  </button>
                  <button
                    onClick={verifyPassphrase}
                    disabled={isAuthenticating}
                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm shadow-lg flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      'Verify Access'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
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
      )}

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