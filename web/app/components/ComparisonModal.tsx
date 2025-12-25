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
        { label: 'Brand', key: 'brand' },
        { label: 'Supplier', key: 'supplier_name' },
        { label: 'Category', key: 'category' },
        { label: 'Pricing', key: 'pricing' },
        { label: 'Availability', key: 'availability' },
    ];

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        </div>
                        Comparison
                        <span className="text-sm font-bold text-gray-400">({products.length}/4)</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-gray-900 active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Table Area (Scrollable) */}
                <div className="flex-1 overflow-auto bg-gray-50/30">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4" /></svg>
                            </div>
                            <p className="font-bold">No products selected</p>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-10 min-w-max">
                            <div className="grid gap-8" style={{ gridTemplateColumns: `180px repeat(${products.length}, 280px)` }}>

                                {/* Labels Column */}
                                <div className="space-y-6 pt-[260px] sticky left-0 z-20">
                                    {attributes.map(attr => (
                                        <div key={attr.label} className="h-12 flex items-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{attr.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Product Columns */}
                                {products.map(product => {
                                    const prices = calculatePrice(product.price_ex_vat);
                                    return (
                                        <div key={product.id} className="space-y-6">
                                            {/* Product Card Header */}
                                            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative group h-[240px] flex flex-col">
                                                <button
                                                    onClick={() => onRemove(product.id)}
                                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors z-30"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>

                                                <div className="h-28 mb-4 flex items-center justify-center bg-gray-50/50 rounded-2xl p-4">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                                    )}
                                                </div>

                                                <h4 className="font-bold text-gray-900 text-xs line-clamp-2 mb-2 leading-snug flex-1">{product.name}</h4>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                    <p className="font-black text-gray-900 text-sm">R {formatPrice(prices.exVat)}</p>
                                                    <button
                                                        onClick={() => onAddToCart(product)}
                                                        className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-90 transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Attribute Rows */}
                                            {attributes.map(attr => {
                                                if (attr.key === 'pricing') {
                                                    return (
                                                        <div key={attr.label} className="h-12 flex flex-col justify-center bg-white/60 rounded-2xl px-5 border border-white shadow-sm">
                                                            <p className="text-sm font-black text-gray-900">R {formatPrice(prices.exVat)}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 tracking-tighter uppercase">Excl. VAT</p>
                                                        </div>
                                                    );
                                                }
                                                if (attr.key === 'availability') {
                                                    const isStocked = product.qty_on_hand > 0;
                                                    return (
                                                        <div key={attr.label} className="h-12 flex items-center bg-white/60 rounded-2xl px-5 border border-white shadow-sm">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isStocked ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                                {isStocked ? `${product.qty_on_hand} In Stock` : 'Out of Stock'}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={attr.label} className="h-12 flex items-center bg-white/60 rounded-2xl px-5 border border-white shadow-sm">
                                                        <p className="text-sm font-bold text-gray-700 truncate">
                                                            {attr.key === 'supplier_name' && userRole === 'public'
                                                                ? 'Verified Master Supplier'
                                                                : (product as any)[attr.key]}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
