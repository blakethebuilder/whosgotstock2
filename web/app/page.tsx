'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryBrowser from './components/CategoryBrowser';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import ComparisonModal from './components/ComparisonModal';
import ProductGrid from './components/ProductGrid';
import ProductTable from './components/ProductTable';
import Navbar from './components/Navbar';
import BentoDashboard from './components/BentoDashboard';
import FilterPanel from './components/FilterPanel';
import ResultsSkeleton from './components/ResultsSkeleton';
import EmptySearchResults from './components/EmptySearchResults';
import AccessPortalModal from './components/AccessPortalModal';
import { Product, Supplier, CartItem, UserRole, UsageStats } from './types';
import { debounce } from '@/lib/debounce';
import { calculatePrice, formatPrice } from '@/lib/pricing';

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
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

  const displayPrice = (product: Product) => {
    if (product.price_on_request) return "Price on Request";
    return `R ${formatPriceDisplay(calculatePriceWithDiscount(product.price_ex_vat).exVat)}`;
  };

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
          <BentoDashboard
            suppliers={suppliers}
            userRole={userRole}
            usageStats={usageStats}
            performSearch={performSearch}
            onCategoryClick={(searchTerm) => { setQuery(searchTerm); performSearch(searchTerm); }}
            onViewAllProducts={() => performSearch("")}
            onShowCategoryBrowser={() => setShowCategoryBrowser(true)}
            setSelectedSuppliers={setSelectedSuppliers}
          />
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                  Results <span className="text-orange-500">{query ? `for "${query}"` : ''}</span>
                </h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Found {totalResults} items in real-time</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-800 mr-2">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800 text-orange-500' : 'text-gray-400 hover:text-gray-600'}`} title="Grid View">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-800 text-orange-500' : 'text-gray-400 hover:text-gray-600'}`} title="Table View">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                </div>
                <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${showFilters ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white dark:bg-gray-900 text-gray-600 border border-gray-200 dark:border-gray-800 hover:border-orange-500/50'}`}>
                  Refine
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>}
                </button>
                <button onClick={clearSearch} className="px-4 py-3 text-xs font-black text-gray-400 uppercase hover:text-red-500 transition-colors">Reset</button>
              </div>
            </div>

            {showFilters && (
              <FilterPanel
                minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}
                selectedCategories={selectedCategories} onShowCategoryBrowser={() => setShowCategoryBrowser(true)}
                sortBy={sortBy} setSortBy={setSortBy}
                userRole={userRole} suppliers={suppliers}
                selectedSuppliers={selectedSuppliers} setSelectedSuppliers={setSelectedSuppliers}
                inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
                searchInDescription={searchInDescription} setSearchInDescription={setSearchInDescription}
                onClearSearch={clearSearch} onPerformSearch={() => performSearch()}
              />
            )}

            {loading ? <ResultsSkeleton /> : results.length === 0 ? <EmptySearchResults onCategoryClick={(searchTerm) => { setQuery(searchTerm); performSearch(searchTerm); }} /> : (
              <>
                {viewMode === 'grid' ? (
                  <ProductGrid products={results} userRole={userRole} onSelectProduct={setSelectedProduct} onToggleCompare={toggleCompare} onAddToCart={addToCart} compareList={compareList} displayPrice={displayPrice} />
                ) : (
                  <ProductTable products={results} userRole={userRole} onSelectProduct={setSelectedProduct} onToggleCompare={toggleCompare} onAddToCart={addToCart} compareList={compareList} displayPrice={displayPrice} />
                )}

                {results.length < totalResults && (
                  <div className="mt-20 flex justify-center">
                    <button onClick={() => performSearch(undefined, true)} disabled={loadingMore} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest px-12 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform active:scale-95 border border-gray-100 dark:border-gray-800 flex items-center gap-3 disabled:opacity-50">
                      {loadingMore && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                      {loadingMore ? 'Fetching More...' : `Load More Items (${totalResults - results.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart} updateQuantity={updateCartQuantity} removeItem={removeCartItem} userRole={userRole} pricingSettings={pricingSettings} />
      <ProductDetailModal product={selectedProduct} isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} onToggleCompare={toggleCompare} isInCompare={!!selectedProduct && !!compareList.find(p => p.id === selectedProduct.id)} calculatePrice={(basePrice: string) => calculatePrice(basePrice, userRole, pricingSettings)} userRole={userRole} />
      <ComparisonModal products={compareList} isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))} onAddToCart={addToCart} formatPrice={formatPriceDisplay} displayPrice={displayPrice} calculatePrice={(base) => calculatePrice(base, userRole, pricingSettings)} userRole={userRole} />

      {compareList.length > 0 && !isCompareModalOpen && (
        <button onClick={() => setIsCompareModalOpen(true)} className="fixed bottom-8 right-8 z-[400] flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-[2rem] shadow-2xl hover:scale-105 transition-all active:scale-95 group border border-white/20">
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

      <AccessPortalModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        passphrase={passphrase}
        setPassphrase={setPassphrase}
        passphraseError={passphraseError}
        onVerify={verifyPassphrase}
        isAuthenticating={isAuthenticating}
      />
    </main>
  );
}