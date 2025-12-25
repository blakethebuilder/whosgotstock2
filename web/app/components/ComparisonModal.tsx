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
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        Product Comparison
                        <span className="text-sm font-bold text-gray-400 ml-2">({products.length}/4 items)</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors font-bold text-gray-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4" /></svg>
                            <p className="font-bold">No products selected for comparison</p>
                        </div>
                    ) : (
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-5 gap-6">
                                {/* Label Column */}
                                <div className="col-span-1 pt-[240px] space-y-12">
                                    <div className="h-20 flex items-center">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pricing</p>
                                    </div>
                                    {attributes.map(attr => (
                                        <div key={attr.label} className="h-10 flex items-center">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{attr.label}</p>
                                        </div>
                                    ))}
                                    <div className="h-10 flex items-center">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Availability</p>
                                    </div>
                                </div>

                                {/* Product Columns */}
                                {products.map(product => {
                                    const prices = calculatePrice(product.price_ex_vat);
                                    return (
                                        <div key={product.id} className="col-span-1 space-y-12 relative group/col p-4 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-blue-50/10 transition-all">
                                            {/* Top Info */}
                                            <div className="flex flex-col items-center text-center">
                                                <button
                                                    onClick={() => onRemove(product.id)}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover/col:opacity-100 transition-opacity hover:bg-red-100"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <div className="h-40 w-40 bg-gray-50 rounded-2xl p-4 flex items-center justify-center mb-6">
                                                    {product.image_url ? (
                                                        <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                                    ) : (
                                                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-sm line-clamp-2 h-10">{product.name}</h3>
                                            </div>

                                            {/* Price Row */}
                                            <div className="h-20 flex flex-col justify-center gap-1">
                                                <p className="text-xl font-black text-blue-600">R {formatPrice(prices.exVat)}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Ex VAT</p>
                                                <p className="text-xs font-bold text-gray-500 italic">R {formatPrice(prices.incVat)} <span className="opacity-50 font-normal">Inc.</span></p>
                                            </div>

                                            {/* Attributes */}
                                            {attributes.map(attr => (
                                                <div key={attr.label} className="h-10 flex items-center">
                                                    <p className="text-sm font-semibold text-gray-700">
                                                        {attr.key === 'supplier_name' && userRole === 'public'
                                                            ? 'Verified Stock'
                                                            : (product as any)[attr.key]}
                                                    </p>
                                                </div>
                                            ))}

                                            {/* Stock */}
                                            <div className="h-10 flex items-center">
                                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${product.qty_on_hand > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {product.qty_on_hand > 0 ? `${product.qty_on_hand} Units` : 'No Stock'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-4">
                                                <button
                                                    onClick={() => onAddToCart(product)}
                                                    className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-2xl text-xs font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Quote
                                                </button>
                                            </div>
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
