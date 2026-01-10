'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryTiles from './components/CategoryTiles';
import CategoryBrowser from './components/CategoryBrowser';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import ComparisonModal from './components/ComparisonModal';
import Navbar from './components/Navbar';
import { Product, Supplier, CartItem, UserRole, UsageStats } from './types';
import { debounce } from '@/lib/debounce';
import { calculatePrice, formatPrice } from '@/lib/pricing';

// Internal tool pricing: Public = +15%, Team = +10%, Management = +5%, Admin = Cost
export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>('public');
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
    public_markup: 15,
    team_markup: 10,
    management_markup: 5,
    admin_markup: 0
  });

  // Comparison State
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Filters
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Filter States - Enhanced for multi-select
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchInDescription, setSearchInDescription] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false);

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
          public_markup: parseInt(settingsData.public_markup || '15'),
          team_markup: parseInt(settingsData.team_markup || '10'),
          management_markup: parseInt(settingsData.management_markup || '5'),
          admin_markup: parseInt(settingsData.admin_markup || '0')
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
    if (savedRole && ['public', 'team', 'management', 'admin'].includes(savedRole)) {
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

  // Debounced search function - Updated for new parameters
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery && selectedSuppliers.length === 0 && selectedCategories.length === 0) {
        return;
      }
      performSearch(searchQuery);
    }, 300),
    [selectedSuppliers, selectedCategories, minPrice, maxPrice, inStockOnly, sortBy, searchInDescription, selectedBrand]
  );

  const performSearch = async (searchQuery?: string) => {
    const currentQuery = searchQuery !== undefined ? searchQuery : query;

    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (currentQuery) params.append('q', currentQuery);
      
      // Multi-supplier support
      if (selectedSuppliers.length > 0) {
        params.append('suppliers', selectedSuppliers.join(','));
      }
      
      // Multi-category support
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }
      
      // Brand filter
      if (selectedBrand) {
        params.append('brand', selectedBrand);
      }
      
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (searchInDescription) params.append('search_description', 'true');
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setPage(1);

      // Track usage for public tier
      if (userRole === 'public') {
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

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = overrideQuery !== undefined ? overrideQuery : query;
    performSearch(searchQuery);
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

      if (selectedSuppliers.length > 0) params.append('suppliers', selectedSuppliers.join(','));
      if (selectedCategories.length > 0) params.append('categories', selectedCategories.join(','));
      if (selectedBrand) params.append('brand', selectedBrand);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (searchInDescription) params.append('search_description', 'true');
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
    const publicPrice = calculatePrice(basePrice, 'public', pricingSettings);
    const discount = userRole !== 'public' ? parseFloat(publicPrice.exVat) - parseFloat(price.exVat) : 0;
    const discountPercentage = userRole !== 'public' ? 
      (discount / parseFloat(publicPrice.exVat) * 100) : 0;

    return {
      ...price,
      originalPrice: publicPrice.exVat,
      discount: discount.toFixed(2),
      discountPercentage: discountPercentage.toFixed(1),
      hasDiscount: userRole !== 'public' && discount > 0
    };
  };

  const handleRoleSwitch = () => {
    if (userRole !== 'public') {
      setUserRole('public');
      return;
    }
    setShowRoleModal(true);
  };

  const verifyPassphrase = async () => {
    setPassphraseError('');
    setIsAuthenticating(true);
    
    // Try each role until we find a match
    const roles = ['team', 'management', 'admin'];
    
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
    setSelectedSuppliers([]);
    setSelectedCategories([]);
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSearchInDescription(false);
    setShowFilters(false);
    setShowCategoryBrowser(false);
    setSortBy('relevance');
  };
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-orange-100 dark:selection:bg-orange-900 selection:text-orange-900 dark:selection:text-orange-100 transition-colors duration-300">
      {/* Navigation */}
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
        userRole={userRole}
        usageStats={usageStats}
        onRoleSwitch={handleRoleSwitch}
        onClearSearch={clearSearch}
      />

      {/* Hero Section */}
      <div className={`transition-all duration-700 ease-in-out relative overflow-hidden ${hasSearched ? 'pt-24 pb-8 min-h-[auto]' : 'min-h-[85vh] flex flex-col justify-center items-center'}`}>
        {/* Animated Background Blobs (Premium Touch) */}
        {!hasSearched && (
          <>
            <div className="absolute top-[15%] left-[8%] w-80 h-80 bg-orange-400/15 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[15%] right-[8%] w-96 h-96 bg-orange-400/10 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_100%)] z-0" />
          </>
        )}

        <div className={`w-full max-w-4xl px-6 mx-auto relative z-10 ${hasSearched ? '' : 'text-center'}`}>
          {!hasSearched && (
            <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="inline-block px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-bold tracking-widest uppercase border border-orange-100 shadow-sm">
                For IT Companies & MSPs
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight">
                Find Stock, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Instantly.</span>
              </h2>
              <p className="text-gray-500 text-xl sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Built specifically for IT companies and MSPs. Compare pricing and stock levels across Scoop, Esquire, Pinnacle, Mustek, and Miro. One search, all suppliers, instant results.
              </p>
            </div>
          )}

          <div className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl transition-all duration-500 relative overflow-hidden border border-white/60 dark:border-gray-700/60 ${hasSearched ? 'ring-1 ring-gray-200 dark:ring-gray-700' : 'hover:shadow-3xl'}`}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center w-full">
              <div className="flex items-center flex-1">
                <div className="pl-8 text-orange-500 hidden sm:block">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  className="flex-1 p-6 text-xl sm:text-2xl bg-transparent focus:outline-none min-w-0 font-medium placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                  placeholder="Search 15,000+ IT products instantly..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex border-t sm:border-t-0 sm:border-l border-gray-100 bg-white/60">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 sm:flex-none py-6 px-8 text-sm font-bold hover:bg-white transition-all flex items-center justify-center gap-2 ${showFilters ? 'text-orange-600 bg-white' : 'text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  <span>Filters</span>
                  {(selectedSuppliers.length > 0 || selectedCategories.length > 0 || inStockOnly || minPrice || maxPrice || selectedBrand) &&
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                  }
                </button>
                <button type="submit" className="flex-1 sm:flex-none bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-12 py-6 font-black text-xl transition-all active:scale-[0.98] shadow-lg shadow-orange-200">
                  Search
                </button>
              </div>
            </form>

            {/* Enhanced Filters Panel */}
            {showFilters && (
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                {/* First Row: Suppliers and Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Multi-Supplier Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Suppliers {selectedSuppliers.length > 0 && `(${selectedSuppliers.length})`}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {suppliers.map(s => {
                        const isSelected = selectedSuppliers.includes(s.slug);
                        return (
                          <button
                            key={s.slug}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSuppliers(selectedSuppliers.filter(slug => slug !== s.slug));
                              } else {
                                setSelectedSuppliers([...selectedSuppliers, s.slug]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-orange-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSuppliers.length > 0 && (
                      <button
                        onClick={() => setSelectedSuppliers([])}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear Suppliers
                      </button>
                    )}
                  </div>

                  {/* Categories Browser Button */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryBrowser(!showCategoryBrowser)}
                      className="w-full px-4 py-2.5 rounded-lg border transition-all text-sm font-semibold flex items-center justify-between 
                        ${selectedCategories.length > 0 
                          ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300'
                        }"
                    >
                      <span>
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} category${selectedCategories.length > 1 ? 'ies' : 'y'} selected`
                          : 'Filter by Category'}
                      </span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {selectedCategories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedCategories.map(cat => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold"
                          >
                            {cat}
                            <button
                              onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                              className="hover:text-orange-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Second Row: Price, Brand, Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Price Range (R)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full p-2 rounded border border-gray-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full p-2 rounded border border-gray-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. HP, Dell, Cisco"
                      className="w-full p-2 rounded border border-gray-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      value={selectedBrand}
                      onChange={e => setSelectedBrand(e.target.value)}
                    />
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Sort By</label>
                    <select
                      className="w-full p-2 rounded border border-gray-200 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="name_asc">Name: A-Z</option>
                      <option value="name_desc">Name: Z-A</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>

                {/* Third Row: Options */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Search Options</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={e => setInStockOnly(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchInDescription}
                        onChange={e => setSearchInDescription(e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Search in Descriptions</span>
                    </label>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(selectedSuppliers.length > 0 || selectedCategories.length > 0 || minPrice || maxPrice || inStockOnly || sortBy !== 'relevance' || selectedBrand || searchInDescription) && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedSuppliers([]);
                        setSelectedCategories([]);
                        setSelectedBrand('');
                        setMinPrice('');
                        setMaxPrice('');
                        setInStockOnly(false);
                        setSearchInDescription(false);
                        setSortBy('relevance');
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-bold"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Category Browser Modal */}
            {showCategoryBrowser && (
              <div 
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowCategoryBrowser(false);
                  }
                }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Browse Categories</h3>
                    <button
                      onClick={() => setShowCategoryBrowser(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                    <CategoryBrowser
                      selectedCategories={selectedCategories}
                      onCategoriesChange={setSelectedCategories}
                      onCategoryClick={(category) => {
                        if (!selectedCategories.includes(category)) {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                        performSearch();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Category Tiles - Show when not searching */}
        {!hasSearched && (
          <div className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {/* Hero Value Proposition */}
            <div className="text-center mb-20">
              <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6 border border-orange-100">
                Powered by AI Technology
              </div>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight">
                Stop Juggling Supplier Websites. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">Source Smarter.</span>
              </h2>
              <p className="text-gray-500 text-xl sm:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Built specifically for IT companies and MSPs. Compare pricing and stock levels across Scoop, Esquire, Pinnacle, Mustek, and Miro. One search, all suppliers, instant results.
              </p>
            </div>

            {/* Category Tiles */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <div className="inline-block px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 border border-orange-100">
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
                    className="text-lg md:text-xl font-black text-gray-400 cursor-pointer hover:text-orange-600 transition-colors px-3 py-2 rounded hover:bg-orange-50"
                  >
                    {brand.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Professional Footer with Disclaimer */}
            <div className="text-center space-y-8 py-20 border-t border-gray-200">
              {/* Main Value Proposition */}
              <div className="space-y-6 mb-12">
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-50 text-orange-700 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 border border-orange-200">
                  Built for Professionals
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">IT Companies</span> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">MSPs</span>
                </h3>
                <div className="max-w-4xl mx-auto text-gray-700 leading-relaxed space-y-6">
                  <p className="text-lg font-medium text-gray-900">
                    Stop juggling multiple supplier websites. Compare prices and stock levels across 
                    <strong className="text-orange-600"> Scoop, Esquire, Pinnacle, Mustek, and Miro</strong> in one powerful search.
                  </p>
                  <p className="text-base text-gray-600">
                    <strong className="text-gray-900">WhosGotStock eliminates the tedious manual work.</strong> Our intelligent sourcing platform aggregates live inventory and pricing 
                    from South Africa's leading IT distributors, transforming hours of comparison work into seconds of smart searching.
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-4xl mx-auto mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-50 p-8 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-orange-900 mb-3">For IT Companies & MSPs</h4>
                    <p className="text-orange-800 leading-relaxed">
                      Generate professional quotes instantly. Connect with Smart Integrate for procurement assistance, 
                      or use staff/manager portals for direct supplier orders. Streamline your sourcing workflow.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-amber-900 mb-3">Sourcing Tool, Not a Store</h4>
                    <p className="text-amber-800 leading-relaxed">
                      We're not an e-commerce platform. We help you find and compare products, 
                      then facilitate orders through your established supplier relationships.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier Network */}
              <div className="mb-12">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-[0.15em] mb-6">Integrated Suppliers</h4>
                <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
                  {[
                    'Scoop', 'Esquire', 'Pinnacle', 'Mustek', 'Miro'
                  ].map(supplier => (
                    <div
                      key={supplier}
                      className="bg-white text-gray-900 font-bold text-lg px-6 py-3 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
                    >
                      {supplier}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-orange-600 font-semibold">+ More suppliers being added regularly</p>
              </div>

              {/* Legal Disclaimer */}
              <div className="max-w-5xl mx-auto pt-8 border-t border-gray-200">
                <div className="bg-gradient-to-r from-gray-50 to-orange-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Important Disclaimer</h4>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed space-y-3 max-w-4xl mx-auto">
                    <p>
                      <strong className="text-gray-900">WhosGotStock is a sourcing tool, not a retailer.</strong> We aggregate product information from supplier feeds 
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
                        <span className="bg-white/80 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-orange-600 border border-orange-50 tracking-wider uppercase">{product.brand}</span>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCompare(product); }}
                          className={`p-2 rounded-full backdrop-blur shadow-sm transition-all border ${compareList.find(p => p.id === product.id)
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white/80 text-gray-400 border-gray-100 hover:text-orange-600'
                            }`}
                          title="Add to Compare"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-2 mb-3 group-hover:text-orange-600 transition-colors">{product.name}</h4>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded uppercase">
                          {userRole === 'public' ? 'Verified Stock' : product.supplier_name}
                        </span>
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
                            className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-90"
                          >
                            + Quote
                          </button>
                        </div>
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
                      <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-bold">Select User Role</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Enter the passphrase to unlock a specific user role and view its corresponding pricing structure.</p>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter Passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-base"
                disabled={isAuthenticating}
              />
              {passphraseError && <p className="text-sm text-red-500">{passphraseError}</p>}
              
              <button
                onClick={verifyPassphrase}
                disabled={!passphrase || isAuthenticating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-all active:scale-[0.98] disabled:bg-orange-300 flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access Portal
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">Current Role: <span className="font-bold text-sm text-orange-600">{userRole.toUpperCase()}</span></p>
              {userRole !== 'public' && (
                <button 
                  onClick={() => {setUserRole('public'); setShowRoleModal(false);}}
                  className="text-xs text-gray-400 mt-2 hover:text-gray-600"
                >
                  Switch back to Public Pricing
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </main>
  );
}