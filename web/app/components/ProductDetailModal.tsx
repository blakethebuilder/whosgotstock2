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

    // Extract description - varies by supplier
    const rawAny = raw as any;
    const description = rawAny.description || rawAny.ProductSummary || rawAny.ProdName || 'No additional description provided.';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-md z-10 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left: Image Panel */}
                <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 relative">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-110 duration-500"
                        />
                    ) : (
                        <div className="text-gray-300 flex flex-col items-center gap-2">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>No Image Available</span>
                        </div>
                    )}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 border border-blue-100 shadow-sm uppercase tracking-wider">{product.brand}</span>
                    </div>
                </div>

                {/* Right: Details Panel */}
                <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">{product.name}</h3>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                {userRole === 'free' ? 'Verified Stock' : product.supplier_name}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500 text-sm font-medium">{product.brand}</span>
                        </div>

                        <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-6 mt-4">
                            <div>
                                <p className="text-3xl font-black text-blue-600">R {formatPrice(prices.exVat)}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Excluding VAT</p>
                            </div>
                            <div className="h-10 w-px bg-gray-100" />
                            <div>
                                <p className="text-lg font-bold text-gray-600">R {formatPrice(prices.incVat)}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Including VAT</p>
                            </div>
                            {userRole === 'free' && (
                                <div className="ml-auto bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-bold border border-blue-100">
                                    Guest Price
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Stock Status */}
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${product.qty_on_hand > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                            <span className={`text-sm font-bold ${product.qty_on_hand > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {product.qty_on_hand > 0 ? `${product.qty_on_hand} Units in Stock` : 'Currently Out of Stock'}
                            </span>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Description</h4>
                            <div
                                className="text-sm text-gray-600 leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                                dangerouslySetInnerHTML={{ __html: description }}
                            />
                        </div>

                        {/* Additional Meta */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Supplier SKU</p>
                                <p className="text-xs font-mono text-gray-700">{(rawAny.sku || rawAny.ProductCode || rawAny.StockCode || 'N/A')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Category</p>
                                <p className="text-xs font-medium text-gray-700">{product.category}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            onClick={() => { onAddToCart(product); onClose(); }}
                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Add to Quote
                        </button>
                        <button
                            onClick={() => onToggleCompare(product)}
                            className={`flex-1 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 border ${isInCompare
                                ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-inner'
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-white hover:border-blue-100'
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                            {isInCompare ? 'In Compare' : 'Compare'}
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
