'use client';

import React, { useState, useEffect } from 'react';
import { Product, UserRole } from '../types';

interface ComparisonModalProps {
    products: Product[];
    isOpen: boolean;
    onClose: () => void;
    onRemove: (id: number) => void;
    onClearAll: () => void;
    onAddToCart: (product: Product) => void;
    formatPrice: (amount: string) => string;
    displayPrice: (product: Product) => { exVat: string; incVat: string; isPOR: boolean };
    calculatePrice: (base: string) => { exVat: string; incVat: string };
    userRole: UserRole;
}

export default function ComparisonModal({
    products,
    isOpen,
    onClose,
    onRemove,
    onClearAll,
    onAddToCart,
    formatPrice,
    displayPrice,
    calculatePrice,
    userRole
}: ComparisonModalProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsExpanded(false);
            setIsMinimized(false);
        }
    }, [isOpen]);

    const attributes = [
        { label: 'Brand', key: 'brand' },
        { label: 'Supplier', key: 'supplier_name' },
        { label: 'Category', key: 'category' },
        { label: 'Price (Ex)', key: 'pricing_ex' },
        { label: 'Price (Inc)', key: 'pricing_inc' },
        { label: 'Stock Status', key: 'availability' },
        { label: 'Overview', key: 'description' },
    ];

    return (
        <>
            {/* Backdrop - Only active when open and not minimized */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen && !isMinimized ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Left sliding Comparison Drawer */}
            <div className={`fixed left-0 top-0 h-full w-full ${isExpanded ? 'md:max-w-[60vw] sm:max-w-3xl' : 'max-w-md'} bg-gray-50 dark:bg-gray-950 shadow-2xl z-[200] transform transition-transform duration-300 ease-out border-r border-white dark:border-gray-900 ${isOpen && !isMinimized ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-850 px-5 py-4 shrink-0 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Compare Products</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Comparing {products.length} item{products.length !== 1 ? 's' : ''} (Max 4)</p>
                            </div>

                            <div className="flex items-center gap-2">
                                {products.length > 0 && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                const ids = products.map(p => p.id).join(',');
                                                const shareUrl = `${window.location.origin}/?compare=${ids}`;
                                                navigator.clipboard.writeText(shareUrl);
                                                alert('Comparison matrix share link copied to clipboard!');
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 px-3 py-2 rounded-lg transition-all"
                                            title="Share this comparison matrix"
                                        >
                                            Share
                                        </button>
                                        <button
                                            onClick={onClearAll}
                                            className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg transition-all"
                                            title="Clear all compared products"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-450 hover:text-gray-700 dark:hover:text-gray-250 rounded-lg transition-colors"
                                    title="Minimize to side dock"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" /></svg>
                                </button>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="hidden sm:flex w-8 h-8 items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-450 hover:text-gray-700 dark:hover:text-gray-250 rounded-lg transition-colors"
                                    title={isExpanded ? "Collapse to single view" : "Expand side-by-side view"}
                                >
                                    {isExpanded ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M6 5l7 7-7 7" /></svg>
                                    )}
                                </button>
                                <button 
                                    onClick={onClose} 
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                                    title="Close Comparison"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Matrix (High Density Scrollable) */}
                    <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/80 dark:bg-gray-950/40 p-3">
                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
                                <svg className="w-10 h-10 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <p className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">No Items Selected</p>
                                <p className="text-[10px] mt-1 text-gray-450 max-w-[200px]">Click the comparison heart icon on search items to populate side-by-side specs.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {/* Product Cards Headers Row */}
                                <div className="grid gap-2" style={{ gridTemplateColumns: isExpanded ? `120px repeat(${products.length}, minmax(140px, 1fr))` : `80px repeat(${products.length}, minmax(110px, 1fr))` }}>
                                    <div className="flex items-end pb-1.5">
                                        <span className={`${isExpanded ? 'text-xs' : 'text-[8px]'} font-black uppercase tracking-wider text-gray-400`}>Specs</span>
                                    </div>
                                    {products.map(product => (
                                        <div key={product.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-2.5 relative group shadow-sm flex flex-col justify-between">
                                            <button
                                                onClick={() => onRemove(product.id)}
                                                className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-150 hover:bg-red-500 hover:text-white text-red-600 rounded-full transition-all flex items-center justify-center text-[9px] font-bold shadow-md active:scale-90"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
 
                                            <div className={`${isExpanded ? 'h-36 sm:h-44 md:h-52' : 'h-20'} flex items-center justify-center bg-gray-50/50 dark:bg-gray-850 rounded-lg p-1 mb-1.5 transition-all duration-300`}>
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                                ) : (
                                                    <svg className={`${isExpanded ? 'w-14 h-14' : 'w-7 h-7'} text-gray-300 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>
 
                                            <div className="text-center min-h-[36px] flex flex-col justify-center mb-1.5">
                                                <p className={`${isExpanded ? 'text-xs' : 'text-[9px]'} font-black text-gray-900 dark:text-white leading-tight line-clamp-2`} title={product.name}>{product.name}</p>
                                                <span className={`${isExpanded ? 'text-[9px]' : 'text-[7px]'} font-bold uppercase text-orange-500 tracking-wider mt-0.5`}>{product.brand}</span>
                                            </div>
 
                                            <button
                                                onClick={() => onAddToCart(product)}
                                                className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-black rounded-md ${isExpanded ? 'py-2 text-[10px]' : 'py-1 text-[8px]'} uppercase tracking-wider transition-all active:scale-95 shadow-sm`}
                                            >
                                                + Quote
                                            </button>
                                        </div>
                                    ))}
                                </div>
 
                                {/* Dynamic Spec Rows */}
                                <div className="space-y-1">
                                    {attributes.map(attr => (
                                        <div key={attr.label} className="grid gap-2" style={{ gridTemplateColumns: isExpanded ? `120px repeat(${products.length}, minmax(140px, 1fr))` : `80px repeat(${products.length}, minmax(110px, 1fr))` }}>
                                            {/* Spec Title Column */}
                                            <div className={`flex items-center px-1.5 py-1 bg-gray-150/40 dark:bg-gray-900 rounded-lg border border-gray-200/50 dark:border-gray-800 ${isExpanded ? 'min-h-[56px] px-3' : 'min-h-[36px]'}`}>
                                                <span className={`${isExpanded ? 'text-[10px] tracking-widest' : 'text-[8px]'} font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none`}>{attr.label}</span>
                                            </div>
 
                                            {/* Compared Values Columns */}
                                            {products.map(product => {
                                                const prices = calculatePrice(product.price_ex_vat);
                                                let cellContent;
 
                                                switch (attr.key) {
                                                    case 'brand':
                                                        cellContent = <span className={`${isExpanded ? 'text-[10px] px-2.5 py-1' : 'text-[8px] px-1.5 py-0.5'} font-black uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/20 rounded`}>{product.brand}</span>;
                                                        break;
                                                    case 'category':
                                                        cellContent = <span className={`${isExpanded ? 'text-[10px]' : 'text-[8px]'} font-bold text-gray-500 dark:text-gray-400 truncate max-w-full`}>{product.category || '—'}</span>;
                                                        break;
                                                    case 'pricing_ex':
                                                        const priceData = displayPrice(product);
                                                        cellContent = (
                                                            <div className="leading-tight">
                                                                <p className={`${isExpanded ? 'text-sm' : 'text-[10px]'} font-black text-gray-950 dark:text-white tabular-nums`}>
                                                                    {userRole === 'public' ? 'Hidden' : priceData.isPOR ? 'POR' : `R ${priceData.exVat}`}
                                                                </p>
                                                                <span className={`${isExpanded ? 'text-[8px]' : 'text-[7px]'} text-gray-400 uppercase tracking-widest font-bold`}>Ex VAT</span>
                                                            </div>
                                                        );
                                                        break;
                                                    case 'pricing_inc':
                                                        cellContent = (
                                                            <div className="leading-tight">
                                                                <p className={`${isExpanded ? 'text-xs' : 'text-[9px]'} font-bold text-gray-500 dark:text-gray-400 tabular-nums`}>
                                                                    {userRole === 'public' ? 'Hidden' : `R ${formatPrice(prices.incVat)}`}
                                                                </p>
                                                                <span className={`${isExpanded ? 'text-[8px]' : 'text-[7px]'} text-gray-400 uppercase tracking-widest font-bold`}>Inc VAT</span>
                                                            </div>
                                                        );
                                                        break;
                                                    case 'availability':
                                                        const isStocked = product.qty_on_hand > 0;
                                                        cellContent = (
                                                            <span className={`inline-flex items-center gap-1.5 rounded-full ${isExpanded ? 'text-[10px] px-3 py-1' : 'text-[8px] px-1.5 py-0.5'} font-black uppercase tracking-tighter ${isStocked ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isStocked ? 'bg-[#4A5D16]' : 'bg-red-500'}`} />
                                                                {isStocked ? `${product.qty_on_hand} Stock` : 'Out'}
                                                            </span>
                                                        );
                                                        break;
                                                    case 'description':
                                                        const description = product.description || product.name || '—';
                                                        cellContent = (
                                                            <div className={`${isExpanded ? 'max-h-36 text-xs' : 'max-h-12 text-[8px]'} overflow-y-auto text-gray-500 dark:text-gray-400 font-medium leading-normal custom-scrollbar`}>
                                                                {description}
                                                            </div>
                                                        );
                                                        break;
                                                    case 'supplier_name':
                                                        cellContent = (
                                                            <span className={`px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded ${isExpanded ? 'text-[10px] px-2.5 py-1' : 'text-[8px]'} font-black uppercase text-gray-400`}>
                                                                {(userRole === 'public' || userRole === 'team') ? 'Smart' : product.supplier_name}
                                                            </span>
                                                        );
                                                        break;
                                                    default:
                                                        cellContent = <p className={`${isExpanded ? 'text-xs' : 'text-[8px]'} font-bold text-gray-700 dark:text-gray-300`}>{(product as any)[attr.key] || '—'}</p>;
                                                }
 
                                                return (
                                                    <div
                                                        key={`${product.id}-${attr.key}`}
                                                        className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-800 flex items-center shadow-sm overflow-hidden ${isExpanded ? 'min-h-[56px] p-3' : 'min-h-[36px] p-1 px-1.5'}`}
                                                    >
                                                        {cellContent}
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
            </div>

            {/* Minimized Dock tab on the left edge */}
            <div 
                onClick={() => setIsMinimized(false)}
                className={`fixed left-0 top-1/2 -translate-y-1/2 h-48 w-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-y border-r border-gray-200 dark:border-gray-850 shadow-2xl z-[500] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col justify-between items-center py-4 rounded-r-xl transition-transform duration-300 ${isOpen && isMinimized ? 'translate-x-0' : '-translate-x-full'}`}
                title="Expand comparison panel"
            >
                <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                    </div>
                    <span className="text-[8px] font-black text-orange-600 bg-orange-100 dark:bg-orange-950 px-1 rounded-full leading-none">
                        {products.length}
                    </span>
                </div>
                
                {/* Vertical Text */}
                <div className="rotate-270 uppercase tracking-widest text-[7px] font-black text-gray-400 whitespace-nowrap select-none my-auto">
                    Compare Matrix
                </div>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 hover:bg-orange-500 hover:text-white transition-all text-gray-500"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7" /></svg>
                </button>
            </div>

            <style jsx>{`
                .rotate-270 {
                    transform: rotate(-90deg);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </>
    );
}