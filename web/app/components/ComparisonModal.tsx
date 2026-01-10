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
            {/* Glass Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Bento-style Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-7xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
                
                {/* Header Tile */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Comparative Analysis.</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Evaluating {products.length} structural specifications</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white dark:bg-gray-800 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm transition-all active:scale-90"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8 bg-white dark:bg-gray-900">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <p className="font-black uppercase tracking-widest text-xs">No Items Selected</p>
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            {/* Product Headers Bento row */}
                            <div className="grid gap-6 mb-10" style={{ gridTemplateColumns: `220px repeat(${products.length}, 1fr)` }}>
                                <div className="flex flex-col justify-end pb-4">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Parameter Matrix</span>
                                </div>
                                {products.map(product => {
                                    const prices = calculatePrice(product.price_ex_vat);
                                    return (
                                        <div key={product.id} className="bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] p-6 relative group border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all">
                                            <button
                                                onClick={() => onRemove(product.id)}
                                                className="absolute top-4 right-4 p-1.5 bg-white dark:bg-gray-700 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>

                                            <div className="h-28 mb-4 flex items-center justify-center bg-white dark:bg-gray-900 rounded-[2rem] p-4 overflow-hidden">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="text-xl font-black text-gray-900 dark:text-white leading-none">R {formatPrice(prices.exVat)}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Excluding VAT</p>
                                                </div>
                                                <button
                                                    onClick={() => onAddToCart(product)}
                                                    className="w-10 h-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Comparison Matrix */}
                            <div className="space-y-4">
                                {attributes.map(attr => (
                                    <div key={attr.label} className="grid gap-6" style={{ gridTemplateColumns: `220px repeat(${products.length}, 1fr)` }}>
                                        {/* Label Title */}
                                        <div className="flex items-center px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{attr.label}</p>
                                        </div>

                                        {/* Row Values */}
                                        {products.map(product => {
                                            const prices = calculatePrice(product.price_ex_vat);
                                            let content;

                                            switch (attr.key) {
                                                case 'name':
                                                    content = <p className="text-sm font-black text-gray-900 dark:text-white leading-tight line-clamp-2">{product.name}</p>;
                                                    break;
                                                case 'pricing_ex':
                                                    content = <p className="text-lg font-black text-gray-900 dark:text-white">R {formatPrice(prices.exVat)}</p>;
                                                    break;
                                                case 'pricing_inc':
                                                    content = <p className="text-base font-bold text-gray-500 dark:text-gray-400 italic">R {formatPrice(prices.incVat)}</p>;
                                                    break;
                                                case 'availability':
                                                    const isStocked = product.qty_on_hand > 0;
                                                    content = (
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isStocked ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                                                            {isStocked ? `${product.qty_on_hand} In Stock` : 'Out of Stock'}
                                                        </span>
                                                    );
                                                    break;
                                                case 'description':
                                                    content = (
                                                        <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description || product.name || '' }} />
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
                                                    className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-50 dark:border-gray-800 flex items-center min-h-[80px]"
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
