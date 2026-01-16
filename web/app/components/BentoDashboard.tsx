'use client';

import React from 'react';
import CategoryTiles from './CategoryTiles';
import { Supplier, UserRole, UsageStats } from '../types';

interface BentoDashboardProps {
    suppliers: Supplier[];
    userRole: UserRole;
    usageStats: UsageStats;
    onCategoryClick: (searchTerm: string) => void;
    onViewAllProducts: () => void;
    onShowCategoryBrowser: () => void;
    setSelectedSuppliers: (slugs: string[]) => void;
    performSearch: (query: string) => void;
}

const BentoDashboard: React.FC<BentoDashboardProps> = ({
    suppliers,
    userRole,
    usageStats,
    onCategoryClick,
    onViewAllProducts,
    onShowCategoryBrowser,
    setSelectedSuppliers,
    performSearch,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">

            {/* HERO FEATURE TILE (LARGE) */}
            <div className="md:col-span-12 bg-white dark:bg-gray-900 rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl shadow-gray-200/50 dark:shadow-none border border-white/40 dark:border-gray-800/40 min-h-[500px] flex flex-col justify-center">
                <div className="relative z-10 space-y-6 max-w-2xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        Live Stock Aggregator
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.95] tracking-tighter">
                        Search All Major <br />
                        <span className="text-orange-500 italic">Suppliers in 1 Box.</span>
                    </h1>
                    <p className="text-lg font-medium text-gray-500 leading-relaxed max-w-xl mx-auto">
                        Built for SA Tech Suppliers, by a tech supplier. Sick of managing 20 tabs and waiting on emails? Find stock instantly across the entire network.
                    </p>
                    <div className="pt-4 flex items-center gap-4 justify-center">
                        <button
                            onClick={onViewAllProducts}
                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-3 active:scale-95 shadow-xl shadow-gray-200 dark:shadow-none"
                        >
                            Start Searching
                            <svg className="w-5 h-5 rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        {userRole === 'admin' && (
                            <a
                                href="/admin"
                                className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-3 active:scale-95 shadow-xl shadow-emerald-200/50"
                            >
                                Admin Portal
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    <div className="bg-[#D8E698] rounded-[2.5rem] p-8 flex flex-col justify-between group cursor-pointer hover:scale-[0.98] transition-all border border-transparent hover:border-[#4A5D16]/20">
                        <div className="flex justify-between items-start">
                            <h3 className="text-2xl font-black text-gray-900 leading-none">Integrated <br />Suppliers</h3>
                            <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center rotate-[-45deg] group-hover:rotate-0 transition-transform">
                                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-8">
                            {suppliers.map(s => (
                                <button
                                    key={s.slug}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (userRole === 'management' || userRole === 'admin') {
                                            setSelectedSuppliers([s.slug]);
                                            performSearch("");
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-white/40 hover:bg-white rounded-xl text-xs font-black text-gray-800 border border-white/20 uppercase tracking-tighter transition-all"
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between overflow-hidden relative">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Network Status</h3>
                            <p className="text-xs font-medium text-gray-400">Live stock checks across providers</p>
                        </div>
                        <div className="mt-6">
                            <div className="text-4xl font-black text-orange-500 mb-2">
                                {usageStats.searchesThisMonth} <span className="text-sm text-gray-300 font-bold uppercase">Aggregated Searches</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (usageStats.searchesThisMonth / usageStats.searchLimit) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 min-h-[220px]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Popular Quick-Tags</h3>
                    <button onClick={onShowCategoryBrowser} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">Explore More</button>
                </div>
                <CategoryTiles
                    onCategoryClick={onCategoryClick}
                />
            </div>

            <div
                onClick={onShowCategoryBrowser}
                className="md:col-span-12 bg-[#FF6B6B] rounded-[2.5rem] p-8 min-h-[140px] flex items-center justify-between group cursor-pointer relative overflow-hidden hover:brightness-105 transition-all shadow-2xl shadow-red-200/50"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight">"Where is the stock?"</h3>
                        <p className="text-red-100 text-sm font-medium mt-1 uppercase tracking-widest">Stop the guessing game. Access the hierarchical category tree.</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 relative z-10">
                    <div className="px-6 py-3 bg-black/10 backdrop-blur rounded-2xl text-white font-black text-xs uppercase tracking-widest border border-white/20">
                        Explore Category Mapping
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BentoDashboard;
