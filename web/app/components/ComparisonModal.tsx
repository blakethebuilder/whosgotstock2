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
        { label: 'Description', key: 'description' },
    ];

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-7xl max-h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900">Product Comparison</h2>
                            <p className="text-sm text-gray-500">Compare {products.length} product{products.length !== 1 ? 's' : ''} side-by-side to make informed decisions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/80 rounded-xl transition-all text-gray-400 hover:text-gray-900 active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-500">No products selected for comparison</p>
                            <p className="text-sm text-gray-400 mt-1">Add products to compare their features and pricing</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {/* Product Headers */}
                            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
                                <div></div> {/* Empty space for labels column */}
                                {products.map(product => {
                                    const prices = calculatePrice(product.price_ex_vat);
                                    return (
                                        <div key={product.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 relative">
                                            <button
                                                onClick={() => onRemove(product.id)}
                                                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors z-10"
                                                title="Remove from comparison"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>

                                            {/* Product Image */}
                                            <div className="h-24 mb-3 flex items-center justify-center bg-gray-50 rounded-xl">
                                                {product.image_url ? (
                                                    <img 
                                                        src={product.image_url} 
                                                        alt={product.name} 
                                                        className="max-h-full max-w-full object-contain mix-blend-multiply" 
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-center flex-1">
                                                    <p className="text-lg font-black text-gray-900">R {formatPrice(prices.exVat)}</p>
                                                    <p className="text-xs text-gray-400">Ex VAT</p>
                                                </div>
                                                <button
                                                    onClick={() => onAddToCart(product)}
                                                    className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-xl shadow-sm active:scale-95 transition-all"
                                                    title="Add to quote"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Comparison Table */}
                            <div className="grid gap-3" style={{ gridTemplateColumns: `200px repeat(${products.length}, 1fr)` }}>
                                {attributes.map(attr => (
                                    <React.Fragment key={attr.label}>
                                        {/* Attribute Label */}
                                        <div className="flex items-center py-3 px-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{attr.label}</p>
                                        </div>

                                        {/* Product Values */}
                                        {products.map(product => {
                                            const prices = calculatePrice(product.price_ex_vat);
                                            let content;

                                            switch (attr.key) {
                                                case 'name':
                                                    content = (
                                                        <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                                                            {product.name}
                                                        </p>
                                                    );
                                                    break;
                                                case 'pricing_ex':
                                                    content = (
                                                        <div>
                                                            <p className="text-lg font-black text-gray-900">R {formatPrice(prices.exVat)}</p>
                                                            <p className="text-xs text-gray-400">Excluding VAT</p>
                                                        </div>
                                                    );
                                                    break;
                                                case 'pricing_inc':
                                                    content = (
                                                        <div>
                                                            <p className="text-lg font-black text-gray-900">R {formatPrice(prices.incVat)}</p>
                                                            <p className="text-xs text-gray-400">Including VAT</p>
                                                        </div>
                                                    );
                                                    break;
                                                case 'availability':
                                                    const isStocked = product.qty_on_hand > 0;
                                                    content = (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                            isStocked 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-red-100 text-red-600'
                                                        }`}>
                                                            {isStocked ? `${product.qty_on_hand} In Stock` : 'Out of Stock'}
                                                        </span>
                                                    );
                                                    break;
                                                case 'description':
                                                    const description = product.description || product.name || 'No detailed description available for this product.';
                                                    content = (
                                                        <div className="max-h-24 overflow-y-auto">
                                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                                {description}
                                                            </p>
                                                        </div>
                                                    );
                                                    break;
                                                case 'supplier_name':
                                                    content = (
                                                        <p className="text-sm font-bold text-gray-700">
                                                            {userRole === 'public' ? 'Verified Supplier' : product.supplier_name}
                                                        </p>
                                                    );
                                                    break;
                                                default:
                                                    content = (
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {(product as any)[attr.key] || 'N/A'}
                                                        </p>
                                                    );
                                            }

                                            return (
                                                <div 
                                                    key={`${product.id}-${attr.key}`} 
                                                    className={`py-3 px-4 bg-white rounded-xl border border-gray-100 ${
                                                        attr.key === 'description' ? 'min-h-[100px]' : 'min-h-[60px]'
                                                    } flex items-center`}
                                                >
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
