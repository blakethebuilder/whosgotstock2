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

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Mobile input focus fix
  useEffect(() => {
    if (showRoleModal) {
      const timer = setTimeout(() => {
        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showRoleModal]);
  
  const [usageStats, setUsageStats] = useState<UsageStats>({
    searchesThisMonth: 0,
    searchLimit: 25,
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
      if (usageData) setUsageStats(usageData);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem('whosgotstock_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Failed to parse cart", e); }
    }
    const savedRole = localStorage.getItem('whosgotstock_user_role');
    if (savedRole && ['public', 'team', 'management', 'admin'].includes(savedRole)) {
      setUserRole(savedRole as UserRole);
    }
  }, []);

  useEffect(() => { localStorage.setItem('whosgotstock_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('whosgotstock_user_role', userRole); }, [userRole]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeCartItem = (id: number) => { setCart(prev => prev.filter(item => item.id !== id)); };

  const performSearch = async (searchQuery?: string, isLoadMore = false) => {
    const currentQuery = searchQuery !== undefined ? searchQuery : query;
    if (isLoadMore) setLoadingMore(true); else setLoading(true);
    if (!isLoadMore) setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (currentQuery) params.append('q', currentQuery);
      if (selectedSuppliers.length > 0) params.append('suppliers', selectedSuppliers.join(','));
      if (selectedCategories.length > 0) params.append('categories', selectedCategories.join(','));
      if (selectedBrand) params.append('brand', selectedBrand);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (inStockOnly) params.append('in_stock', 'true');
      if (searchInDescription) params.append('search_description', 'true');
      if (sortBy) params.append('sort', sortBy);
      
      const currentPage = isLoadMore ? page + 1 : 1;
      params.append('page', currentPage.toString());

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      
      if (isLoadMore) {
        setResults(prev => [...prev, ...(data.results || [])]);
        setPage(currentPage);
      } else {
        setResults(data.results || []);
        setTotalResults(data.total || 0);
        setPage(1);
      }

      if (userRole === 'public' && !isLoadMore) {
        const newSearchCount = usageStats.searchesThisMonth + 1;
        setUsageStats(prev => ({ ...prev, searchesThisMonth: newSearchCount, isLimitReached: newSearchCount >= prev.searchLimit }));
        fetch('/api/user/track-usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'search' }) }).catch(console.error);
      }
    } catch (err) { console.error(err); } finally { 
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery && selectedSuppliers.length === 0 && selectedCategories.length === 0) return;
      performSearch(searchQuery);
    }, 400),
    [selectedSuppliers, selectedCategories, minPrice, maxPrice, inStockOnly, sortBy, searchInDescription, selectedBrand]
  );

  useEffect(() => {
    if (query.length > 2 || query.length === 0) debouncedSearch(query);
  }, [query, debouncedSearch]);

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
    setPage(1);
  };

  const calculatePriceWithDiscount = (basePrice: string) => {
    const price = calculatePrice(basePrice, userRole, pricingSettings);
    const publicPrice = calculatePrice(basePrice, 'public', pricingSettings);
    const discount = userRole !== 'public' ? parseFloat(publicPrice.exVat) - parseFloat(price.exVat) : 0;
    const discountPercentage = userRole !== 'public' ? (discount / parseFloat(publicPrice.exVat) * 100) : 0;
    return { ...price, originalPrice: publicPrice.exVat, discount: discount.toFixed(2), discountPercentage: discountPercentage.toFixed(1), hasDiscount: userRole !== 'public' && discount > 0 };
  };

  const verifyPassphrase = async () => {
    setPassphraseError('');
    setIsAuthenticating(true);
    const roles = ['team', 'management', 'admin'];
    for (const role of roles) {
      try {
        const response = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passphrase, role }) });
        const data = await response.json();
        if (data.success) {
          setUserRole(data.role as UserRole);
          setShowRoleModal(false);
          setPassphrase('');
          setIsAuthenticating(false);
          return;
        }
      } catch (error) { console.error('Auth error', error); }
    }
    setPassphraseError('Invalid passphrase');
    setIsAuthenticating(false);
  };

  const toggleCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) return prev.filter(p => p.id !== product.id);
      if (prev.length >= 4) return prev;
      return [...prev, product];
    });
  };

  const formatPriceDisplay = (amount: string) => parseFloat(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hasActiveFilters = selectedSuppliers.length > 0 || selectedCategories.length > 0 || minPrice || maxPrice || inStockOnly || selectedBrand || searchInDescription;

  return (
    <main className="min-h-screen bg-[#F3F4F1] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-orange-100 transition-colors duration-300 pb-12">
      <Navbar
        cart={cart}
        onCartOpen={() => setIsCartOpen(true)}
        userRole={userRole}
        usageStats={usageStats}
        onRoleSwitch={() => setShowRoleModal(true)}
        onClearSearch={clearSearch}
        searchQuery={query}
        onSearchChange={setQuery}
        compareCount={compareList.length}
        onCompareOpen={() => setIsCompareModalOpen(true)}
      />

      <div className="max-w-[1400px] mx-auto px-6 pt-32">
        {!hasSearched ? (
          /* MODERN BENTO DASHBOARD */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
            
            {/* HERO FEATURE TILE (LARGE) */}
            <div className="md:col-span-8 bg-white dark:bg-gray-900 rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl shadow-gray-200/50 dark:shadow-none border border-white/40 dark:border-gray-800/40 min-h-[500px] flex flex-col justify-center">
                <div className="relative z-10 space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        Live Stock Aggregator
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter">
                        Find Stock, <br/>
                        <span className="text-orange-500 italic">Instantly.</span>
                    </h1>
                    <p className="text-lg font-medium text-gray-500 leading-relaxed">
                        Built for IT Professionals. Compare pricing across all major SA suppliers in one powerful dashboard.
                    </p>
                    <div className="pt-4 flex items-center gap-4">
                        <button 
                            onClick={() => performSearch("")}
                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-3 active:scale-95 shadow-xl shadow-gray-200 dark:shadow-none"
                        >
                            View All Products
                            <svg className="w-5 h-5 rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                </div>

                <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-1/2 hidden md:block select-none group-hover:scale-110 transition-transform duration-1000 ease-out pointer-events-none">
                     <div className="relative">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/20 blur-[120px] rounded-full" />
                        <img 
                            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop" 
                            alt="Stock Hero" 
                            className="w-full h-auto object-contain rounded-[2rem] shadow-2xl rotate-[15deg] mix-blend-darken dark:mix-blend-normal"
                        />
                     </div>
                </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6">
                <div className="flex-1 bg-[#D8E698] rounded-[2.5rem] p-8 flex flex-col justify-between group cursor-pointer hover:scale-[0.98] transition-all border border-transparent hover:border-[#4A5D16]/20">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-gray-900 leading-none">Integrated <br/>Suppliers</h3>
                        <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center rotate-[-45deg] group-hover:rotate-0 transition-transform">
                             <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-8">
                        {suppliers.map(s => (
                            <button 
                                key={s.slug} 
                                onClick={(e) => { e.stopPropagation(); setSelectedSuppliers([s.slug]); performSearch(""); }}
                                className="px-3 py-1.5 bg-white/40 hover:bg-white rounded-xl text-xs font-black text-gray-800 border border-white/20 uppercase tracking-tighter transition-all"
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between overflow-hidden relative">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Usage Monitor</h3>
                        <p className="text-xs font-medium text-gray-400">Search activity for current cycle</p>
                    </div>
                    <div className="mt-6">
                        <div className="text-4xl font-black text-orange-500 mb-2">
                            {usageStats.searchesThisMonth} <span className="text-sm text-gray-300 font-bold uppercase">Searches</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-orange-500 transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (usageStats.searchesThisMonth / usageStats.searchLimit) * 100)}%` }} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div 
                onClick={() => { setQuery("Networking"); performSearch("Networking"); }}
                className="md:col-span-3 bg-[#E8E8E8] dark:bg-gray-900 rounded-[2.5rem] p-8 min-h-[220px] flex flex-col justify-between group cursor-pointer hover:bg-white transition-colors border border-transparent hover:border-gray-200"
            >
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Networking</h3>
                    <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center rotate-[-45deg] group-hover:rotate-0 transition-all">
                        <svg className="w-4 h-4 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </div>
                <div className="flex gap-2 mt-4 overflow-hidden">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl p-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M2.83 6.829a15 15 0 0121.34 0" /></svg>
                    </div>
                </div>
            </div>

            <div className="md:col-span-9 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 min-h-[220px]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Popular Quick-Tags</h3>
                    <button onClick={() => setShowCategoryBrowser(true)} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">Explore More</button>
                </div>
                <CategoryTiles 
                    onCategoryClick={(searchTerm) => {
                        setQuery(searchTerm);
                        performSearch(searchTerm);
                    }}
                />
            </div>

            <div 
                onClick={() => setShowCategoryBrowser(true)}
                className="md:col-span-12 bg-[#FF6B6B] rounded-[2.5rem] p-8 min-h-[140px] flex items-center justify-between group cursor-pointer relative overflow-hidden hover:brightness-105 transition-all shadow-2xl shadow-red-200/50"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight">Advanced Categorical Drilldown</h3>
                        <p className="text-red-100 text-sm font-medium mt-1 uppercase tracking-widest">Open the structural hierarchy explorer</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="px-6 py-3 bg-black/10 backdrop-blur rounded-2xl text-white font-black text-xs uppercase tracking-widest border border-white/20">
                        {selectedCategories.length} Categories Selected
                    </div>
                </div>
            </div>

          </div>
        ) : (
          /* SEARCH RESULTS VIEW */
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                  Results <span className="text-orange-500">{query ? `for "${query}"` : ''}</span>
                </h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Found {totalResults} items in real-time</p>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${showFilters ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white dark:bg-gray-900 text-gray-600 border border-gray-200 dark:border-gray-800 hover:border-orange-500/50'}`}>
                    Refine
                    {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>}
                 </button>
                 <button onClick={clearSearch} className="px-4 py-3 text-xs font-black text-gray-400 uppercase hover:text-red-500 transition-colors">Reset</button>
              </div>
            </div>

            {/* EXPANDABLE MODERN FILTER PANEL */}
            {showFilters && (
              <div className="mb-10 p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/40 dark:shadow-none animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price Boundary</label>
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20" />
                      <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 shrink-0" />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Brand Filter</label>
                    <input type="text" placeholder="e.g. Cisco, HP, Dell" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20 font-bold" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categories</label>
                    <button onClick={() => setShowCategoryBrowser(true)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex justify-between items-center">
                      {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Browse Structure'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {selectedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories.slice(0, 3).map(c => <span key={c} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">{c}</span>)}
                        {selectedCategories.length > 3 && <span className="text-[9px] text-gray-400 font-bold">+{selectedCategories.length - 3} more</span>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Priority Order</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20 font-bold appearance-none cursor-pointer">
                      <option value="relevance">Sort by Relevance</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="name_asc">Name: A - Z</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Supplier Network</label>
                        <div className="flex flex-wrap gap-2">
                            {suppliers.map(s => {
                                const active = selectedSuppliers.includes(s.slug);
                                return (
                                    <button 
                                        key={s.slug} 
                                        onClick={() => active ? setSelectedSuppliers(selectedSuppliers.filter(x => x !== s.slug)) : setSelectedSuppliers([...selectedSuppliers, s.slug])}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col justify-end gap-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Search Intensity</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} className="w-5 h-5 rounded-lg border-gray-200 text-orange-500 focus:ring-orange-500/20" />
                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">In Stock Only</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={searchInDescription} onChange={e => setSearchInDescription(e.target.checked)} className="w-5 h-5 rounded-lg border-gray-200 text-orange-500 focus:ring-orange-500/20" />
                                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Scan Descriptions</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                   <button onClick={clearSearch} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Reset All Parameters</button>
                   <button onClick={() => performSearch()} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-300 dark:shadow-none hover:scale-105 active:scale-95 transition-all">Apply Filter Matrix</button>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Accessing Distributor Feeds...</p>
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-5xl mb-4">🔍</div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white">No matches found</h4>
                <p className="text-gray-400 mt-2">Try adjusting your filters or expanding your search terms.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {results.map((product) => (
                <div key={product.id} onClick={() => setSelectedProduct(product)} className="group bg-white dark:bg-gray-900 rounded-[2.5rem] p-4 border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-all duration-500 cursor-pointer relative">
                    <div className="aspect-square bg-[#F8F9FA] dark:bg-gray-800 rounded-[2rem] mb-4 flex items-center justify-center overflow-hidden relative p-8">
                         {product.image_url ? (
                             <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700" />
                         ) : (
                             <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         )}
                         <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-white/50 text-orange-600">{product.brand}</div>
                         <button onClick={(e) => { e.stopPropagation(); toggleCompare(product); }} className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur shadow-sm transition-all border ${compareList.find(p => p.id === product.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/80 dark:bg-gray-700/80 text-gray-400 border-white hover:text-orange-500'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg></button>
                    </div>
                    <div className="px-2 pb-2">
                        <h4 className="font-black text-gray-900 dark:text-white text-base line-clamp-2 leading-tight mb-2 group-hover:text-orange-500 transition-colors">{product.name}</h4>
                        <div className="flex items-center gap-2 mb-4"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">{userRole === 'public' ? 'Distributor Stock' : product.supplier_name}</span></div>
                        <div className="flex items-end justify-between gap-4 mt-6">
                            <div className="space-y-0.5">
                                <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">R {formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).exVat)}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Excluding VAT</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                 <div className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>{product.qty_on_hand > 0 ? `${product.qty_on_hand} Stock` : 'Out of Stock'}</div>
                                 <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none">+ Quote</button>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>

            {results.length < totalResults && (
              <div className="mt-20 flex justify-center">
                <button 
                  onClick={() => performSearch(undefined, true)} 
                  disabled={loadingMore}
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest px-12 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform active:scale-95 border border-gray-100 dark:border-gray-800 flex items-center gap-3 disabled:opacity-50"
                >
                  {loadingMore && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                  {loadingMore ? 'Fetching More...' : `Load More Items (${totalResults - results.length} remaining)`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FIXED: Re-added ComparisonModal and CartDrawer functionality */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} updateQuantity={updateCartQuantity} removeItem={removeCartItem} userRole={userRole} pricingSettings={pricingSettings} />
      <ProductDetailModal product={selectedProduct} isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} onToggleCompare={toggleCompare} isInCompare={!!selectedProduct && !!compareList.find(p => p.id === selectedProduct.id)} calculatePrice={(basePrice: string) => calculatePrice(basePrice, userRole, pricingSettings)} userRole={userRole} />
      <ComparisonModal products={compareList} isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))} onAddToCart={addToCart} formatPrice={formatPriceDisplay} calculatePrice={(base) => calculatePrice(base, userRole, pricingSettings)} userRole={userRole} />

      {/* Floating Comparison Toggle */}
      {compareList.length > 0 && !isCompareModalOpen && (
        <button 
            onClick={() => setIsCompareModalOpen(true)}
            className="fixed bottom-8 right-8 z-[400] flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-[2rem] shadow-2xl hover:scale-105 transition-all animate-in slide-in-from-bottom-4 active:scale-95 group border border-white/20"
        >
            <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">{compareList.length}</span>
            </div>
            <span className="font-black text-xs uppercase tracking-widest">Compare Selection</span>
        </button>
      )}

      {showCategoryBrowser && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowCategoryBrowser(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl max-w-6xl w-full h-full max-h-[85vh] overflow-hidden border border-white/20">
             <button onClick={() => setShowCategoryBrowser(false)} className="absolute top-8 right-8 z-[510] p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-red-500 hover:text-white transition-all group shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
             <CategoryBrowser selectedCategories={selectedCategories} onCategoriesChange={setSelectedCategories} onCategoryClick={(category) => { if (!selectedCategories.includes(category)) { setSelectedCategories([...selectedCategories, category]); } performSearch(); }} />
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setShowRoleModal(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-[3rem] p-10 max-w-lg w-full animate-in zoom-in-95 duration-300 shadow-2xl border border-white/20">
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Access Portal</h3>
            <p className="text-gray-400 font-medium mb-8 text-sm uppercase tracking-widest">Verify your credentials</p>
            <input type="password" placeholder="Passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl mb-4 focus:ring-2 focus:ring-orange-500/20 text-lg outline-none text-gray-900 dark:text-white font-bold" />
            {passphraseError && <p className="text-xs font-bold text-red-500 mb-4 ml-2 uppercase tracking-widest">{passphraseError}</p>}
            <button onClick={verifyPassphrase} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-4 rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-gray-400/20 active:scale-[0.98]">{isAuthenticating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enter Portal'}</button>
          </div>
        </div>
      )}
    </main>
  );
}