import { Product, UserRole } from '../types';

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: any) => void;
    onToggleCompare: (product: Product) => void;
    isInCompare: boolean;
    calculatePrice: (base: string) => { exVat: string; incVat: string };
    userRole: UserRole;
}

export default function ProductDetailModal({
    product,
    isOpen,
    onClose,
    onAddToCart,
    onToggleCompare,
    isInCompare,
    calculatePrice,
    userRole
}: ProductDetailModalProps) {
    if (!isOpen || !product) return null;

    const formatPrice = (amount: string) => {
        return parseFloat(amount).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const prices = calculatePrice(product.price_ex_vat);

    let raw = {};
    if (typeof product.raw_data === 'string') {
        try {
            raw = JSON.parse(product.raw_data);
        } catch (e) {
            console.error("Failed to parse raw_data", e);
        }
    } else {
        raw = product.raw_data || {};
    }

    const rawAny = raw as any;
    const description = rawAny.description || rawAny.ProductSummary || rawAny.ProdName || 'No additional description provided.';

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            {/* Glass Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Bento-style Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300 border border-white/20">
                
                {/* Close Button - Floating Circle */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-gray-100 dark:bg-gray-800 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm z-[700] transition-all active:scale-90 group"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left: Image Canvas (Bento Tile Style) */}
                <div className="w-full md:w-1/2 bg-[#F8F9FA] dark:bg-gray-800 flex items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_0%,transparent_100%)] pointer-events-none" />
                    
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform hover:scale-105 duration-700 relative z-10"
                        />
                    ) : (
                        <div className="text-gray-200 flex flex-col items-center gap-4">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-black uppercase tracking-widest text-xs opacity-50">No Visual Assets</span>
                        </div>
                    )}
                    
                    <div className="absolute bottom-8 left-8">
                        <div className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-2xl border border-white/20 shadow-xl">
                            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{product.brand}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Modern Details Grid */}
                <div className="w-full md:w-1/2 p-10 overflow-y-auto flex flex-col bg-white dark:bg-gray-900">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                             <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {userRole === 'public' ? 'Distributor Source' : product.supplier_name}
                            </span>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter mb-6">{product.name}</h3>

                        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">R {formatPrice(prices.exVat)}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Excluding VAT</p>
                            </div>
                            <div className="flex flex-col justify-center border-l border-gray-200 dark:border-gray-700 pl-4">
                                <p className="text-lg font-bold text-gray-500 dark:text-gray-400 leading-none mb-1">R {formatPrice(prices.incVat)}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Including VAT</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                        {/* Status Bento Row */}
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${product.qty_on_hand > 0 ? 'bg-[#4A5D16] animate-pulse' : 'bg-red-500'}`} />
                                {product.qty_on_hand > 0 ? `${product.qty_on_hand} Units In Stock` : 'Currently Unavailable'}
                            </div>
                            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                SKU: {(rawAny.sku || rawAny.ProductCode || rawAny.StockCode || 'N/A')}
                            </div>
                        </div>

                        {/* Description - Card Style */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Structural Overview</h4>
                            <div
                                className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-h-64 overflow-y-auto pr-2 custom-scrollbar font-medium"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        </div>
                    </div>

                    {/* Modern Action Bar */}
                    <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                        <button
                            onClick={() => { onAddToCart(product); onClose(); }}
                            className="flex-[2] bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-5 rounded-[1.5rem] shadow-2xl shadow-gray-200 dark:shadow-none transition-all active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Generate Quote
                        </button>
                        <button
                            onClick={() => onToggleCompare(product)}
                            className={`flex-1 font-black py-5 rounded-[1.5rem] transition-all active:scale-[0.98] flex items-center justify-center gap-3 border ${isInCompare
                                ? 'bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-100'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <svg className="w-6 h-6 transition-transform group-active:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}