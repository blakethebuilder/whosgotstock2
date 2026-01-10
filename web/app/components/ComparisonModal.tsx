import React from 'react';
import { Product, UserRole } from '../types';

interface ComparisonModalProps {
    products: Product[];
    isOpen: boolean;
    onClose: () => void;
    onRemove: (id: number) => void;
    onAddToCart: (product: Product) => void;
    formatPrice: (amount: string) => string;
    calculatePrice: (base: string) => { exVat: string; incVat: string };
    userRole: UserRole;
}

export default function ComparisonModal({
    products,
    isOpen,
    onClose,
    onRemove,
    onAddToCart,
    formatPrice,
    calculatePrice,
    userRole
}: ComparisonModalProps) {
    if (!isOpen) return null;

    const attributes = [
        { label: 'Product Name', key: 'name' },
        { label: 'Brand', key: 'brand' },
        { label: 'Supplier', key: 'supplier_name' },
        { label: 'Category', key: 'category' },
        { label: 'Price (Ex VAT)', key: 'pricing_ex' },
        { label: 'Price (Inc VAT)', key: 'pricing_inc' },
        { label: 'Stock Status', key: 'availability' },
        { label: 'Overview', key: 'description' },
    ];

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content - Reduced Max Height */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-7xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
                
                {/* Header Tile */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 shadow-lg shadow-gray-200/50">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Product Comparison</h2>
                            <p className="text-sm text-gray-500">Comparing {products.length} item{products.length !== 1 ? 's' : ''}. Max 4 items.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-red-500/10 hover:text-red-500 text-gray-400 rounded-2xl transition-all active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4" /></svg>
                            </div>
                            <p className="font-bold text-gray-500">Nothing Selected</p>
                            <p className="text-sm text-gray-400 mt-1">Select items to see a side-by-side comparison.</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Product Headers - Bento Style */}
                            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `220px repeat(${products.length}, 1fr)` }}>
                                <div></div> {/* Empty space for labels column */}
                                {products.map(product => {
                                    const prices = calculatePrice(product.price_ex_vat);
                                    return (
                                        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-lg p-5 relative">
                                            <button
                                                onClick={() => onRemove(product.id)}
                                                className="absolute top-4 right-4 p-1.5 bg-gray-50 dark:bg-gray-700 text-gray-300 hover:text-red-500 rounded-lg transition-colors active:scale-90"
                                                title="Remove from comparison"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>

                                            {/* Product Image */}
                                            <div className="h-32 mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 relative overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                                ) : (
                                                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>

                                            <div className="text-center">
                                                <p className="text-base font-black text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">{product.name}</p>
                                                <p className="text-sm font-bold text-gray-500">{product.brand}</p>
                                            </div>

                                            <button
                                                onClick={() => onAddToCart(product)}
                                                className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95"
                                            >
                                                Add to Quote
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Comparison Matrix */}
                            <div className="space-y-4">
                                {attributes.map(attr => (
                                    <div key={attr.label} className="grid gap-4" style={{ gridTemplateColumns: `220px repeat(${products.length}, 1fr)` }}>
                                        {/* Attribute Label */}
                                        <div className="flex items-center px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{attr.label}</p>
                                        </div>

                                        {/* Product Values */}
                                        {products.map(product => {
                                            const prices = calculatePrice(product.price_ex_vat);
                                            let content;

                                            switch (attr.key) {
                                                case 'name':
                                                case 'brand':
                                                case 'category':
                                                    content = <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{product[attr.key as keyof Product] || '—'}</p>;
                                                    break;
                                                case 'pricing_ex':
                                                    content = (
                                                        <div className="text-left">
                                                            <p className="text-lg font-black text-gray-900 dark:text-white">R {formatPrice(prices.exVat)}</p>
                                                            <p className="text-xs text-gray-400">Ex VAT</p>
                                                        </div>
                                                    );
                                                    break;
                                                case 'pricing_inc':
                                                    content = (
                                                        <div className="text-left">
                                                            <p className="text-base font-bold text-gray-600 dark:text-gray-300">R {formatPrice(prices.incVat)}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Inc VAT</p>
                                                        </div>
                                                    );
                                                    break;
                                                case 'availability':
                                                    const isStocked = product.qty_on_hand > 0;
                                                    content = (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isStocked ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-100 text-red-600'}`}>
                                                            {isStocked ? `${product.qty_on_hand} In Stock` : 'Out of Stock'}
                                                        </span>
                                                    );
                                                    break;
                                                case 'description':
                                                    const description = product.description || product.name || 'No detailed description available for this product.';
                                                    content = (
                                                        <div className="max-h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed pr-2">
                                                            {description}
                                                        </div>
                                                    );
                                                    break;
                                                case 'supplier_name':
                                                    content = <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[9px] font-black uppercase text-gray-500">{userRole === 'public' ? 'Verified Stock' : product.supplier_name}</span>;
                                                    break;
                                                default:
                                                    content = <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{(product as any)[attr.key] || '—'}</p>;
                                            }

                                            return (
                                                <div 
                                                    key={`${product.id}-${attr.key}`} 
                                                    className={`p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex items-center min-h-[100px] shadow-sm`}
                                                >
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
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