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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out relative">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* HERO FEATURE TILE (LARGE) */}
            <div className="md:col-span-12 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[4rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-800 flex flex-col justify-center min-h-[600px]">
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 space-y-10 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border border-white/50 dark:border-gray-700/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        Unified Supply Intelligence
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-orange-500 font-black text-2xl md:text-3xl tracking-tighter italic">WhosGotStock?</h2>
                        <h1 className="text-7xl md:text-8xl lg:text-9xl font-black text-gray-900 dark:text-white leading-[0.85] tracking-tighter">
                            Find Stock <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Instantly.</span>
                        </h1>
                    </div>

                    <p className="text-xl md:text-2xl font-medium text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        One interface. <span className="text-gray-900 dark:text-white font-bold">20+ Suppliers.</span> <span className="text-gray-900 dark:text-white font-bold">Zero Hassle.</span><br className="hidden md:block" />
                        Built by suppliers, for suppliers. Stop the tab-switching nightmare.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center gap-6 justify-center">
                        <button
                            onClick={onViewAllProducts}
                            className="group relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-[2rem] font-black text-base hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-gray-400/20 flex items-center gap-4 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative">Start Searching Now</span>
                            <svg className="w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        {userRole === 'admin' && (
                            <a
                                href="/admin"
                                className="px-8 py-5 rounded-[2rem] font-black text-base border-2 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-3"
                            >
                                Admin System
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* INTEGRATED SUPPLIERS TILE */}
            <div className="md:col-span-4 bg-gradient-to-br from-[#D8E698] to-[#C5D67A] rounded-[3rem] p-10 flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:shadow-[#D8E698]/30 transition-all border border-white/20">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-3xl font-black text-gray-900 leading-[0.9] tracking-tighter">Verified <br />Distributors</h3>
                        <div className="w-12 h-12 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform shadow-lg border border-white/20">
                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {suppliers.map(s => (
                            <span
                                key={s.slug}
                                className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl text-[10px] font-black text-gray-800 border border-white/20 uppercase tracking-widest"
                            >
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>
                <p className="mt-8 text-sm font-bold text-[#4A5D16] opacity-60 uppercase tracking-widest">Live Network Connected</p>
            </div>

            {/* NETWORK STATUS TILE */}
            <div className="md:col-span-4 bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between relative group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter italic">Network Load</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Real-time query aggregation</p>
                </div>
                <div className="mt-6">
                    <div className="flex items-end gap-2 mb-3">
                        <span className="text-5xl font-black text-orange-500 tabular-nums">
                            {usageStats.searchesThisMonth}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 uppercase pb-2 tracking-widest">Points Aggregated</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (usageStats.searchesThisMonth / usageStats.searchLimit) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* CATEGORY EXPLORER CUE */}
            <div
                onClick={onShowCategoryBrowser}
                className="md:col-span-4 bg-[#FF6B6B] rounded-[3rem] p-10 flex flex-col justify-between group cursor-pointer relative overflow-hidden hover:brightness-105 transition-all shadow-2xl shadow-red-200/50"
            >
                <div className="absolute -right-8 -bottom-8 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="flex flex-col gap-6 relative z-10 h-full">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tighter italic">Structural <br />Hierarchy</h3>
                        <p className="text-red-100 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] opacity-80">Drill down via mapping</p>
                    </div>
                </div>
            </div>

            {/* QUICK TAGS / COLLECTIONS */}
            <div className="md:col-span-12 bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 min-h-[250px] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Curated Collections</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Instant filtering for top hardware</p>
                    </div>
                    <button
                        onClick={onShowCategoryBrowser}
                        className="group flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-all border border-gray-100 dark:border-gray-700"
                    >
                        View System Tree
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                </div>
                <div className="relative z-10">
                    <CategoryTiles
                        onCategoryClick={onCategoryClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default BentoDashboard;
