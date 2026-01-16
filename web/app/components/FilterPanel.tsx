'use client';

import React from 'react';
import { Supplier, UserRole } from '../types';

interface FilterPanelProps {
    minPrice: string;
    setMinPrice: (val: string) => void;
    maxPrice: string;
    setMaxPrice: (val: string) => void;
    selectedBrand: string;
    setSelectedBrand: (val: string) => void;
    selectedCategories: string[];
    onShowCategoryBrowser: () => void;
    sortBy: string;
    setSortBy: (val: string) => void;
    userRole: UserRole;
    suppliers: Supplier[];
    selectedSuppliers: string[];
    setSelectedSuppliers: (slugs: string[]) => void;
    inStockOnly: boolean;
    setInStockOnly: (val: boolean) => void;
    searchInDescription: boolean;
    setSearchInDescription: (val: boolean) => void;
    onClearSearch: () => void;
    onPerformSearch: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    selectedBrand,
    setSelectedBrand,
    selectedCategories,
    onShowCategoryBrowser,
    sortBy,
    setSortBy,
    userRole,
    suppliers,
    selectedSuppliers,
    setSelectedSuppliers,
    inStockOnly,
    setInStockOnly,
    searchInDescription,
    setSearchInDescription,
    onClearSearch,
    onPerformSearch,
}) => {
    return (
        <div className="mb-10 p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/40 dark:shadow-none animate-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Price Range */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price Boundary</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={e => setMinPrice(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20"
                        />
                        <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={e => setMaxPrice(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20"
                        />
                    </div>
                </div>

                {/* Brand Filter */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Brand Filter</label>
                    <input
                        type="text"
                        placeholder="e.g. Cisco, HP, Dell"
                        value={selectedBrand}
                        onChange={e => setSelectedBrand(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                    />
                </div>

                {/* Category Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Categories</label>
                    <button
                        onClick={onShowCategoryBrowser}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex justify-between items-center"
                    >
                        {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Browse Structure'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedCategories.slice(0, 3).map(c => (
                                <span key={c} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">{c}</span>
                            ))}
                            {selectedCategories.length > 3 && <span className="text-[9px] text-gray-400 font-bold">+{selectedCategories.length - 3} more</span>}
                        </div>
                    )}
                </div>

                {/* Sort Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Priority Order</label>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-orange-500/20 font-bold appearance-none cursor-pointer"
                    >
                        <option value="relevance">Sort by Relevance</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name_asc">Name: A - Z</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                {(userRole === 'management' || userRole === 'admin') ? (
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
                ) : (
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">Supplier Network</label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] font-bold text-gray-400 uppercase italic mb-2">Supplier information is restricted to Premium Tiers.</p>
                            <p className="text-[10px] font-bold text-orange-500 uppercase">{suppliers.length} Suppliers Integrated</p>
                        </div>
                    </div>
                )}
                <div className="flex flex-col justify-end gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Search Intensity</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={e => setInStockOnly(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-gray-200 text-orange-500 focus:ring-orange-500/20"
                            />
                            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">In Stock Only</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={searchInDescription}
                                onChange={e => setSearchInDescription(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-gray-200 text-orange-500 focus:ring-orange-500/20"
                            />
                            <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">Scan Descriptions</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <button onClick={onClearSearch} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Reset All Parameters</button>
                <button onClick={onPerformSearch} className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-300 dark:shadow-none hover:scale-105 active:scale-95 transition-all">Apply Filter Matrix</button>
            </div>
        </div>
    );
};

export default FilterPanel;
