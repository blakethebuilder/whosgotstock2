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
            <div className="md:col-span-12 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-800 flex flex-col justify-center min-h-[400px]">
                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 space-y-6 max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border border-white/50 dark:border-gray-700/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        Unified Supply Intelligence
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-orange-500 font-black text-lg md:text-xl tracking-tighter italic">Instant Channel Visibility.</h2>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
                            The Pulse of SA's<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Tech Supply Chain.</span>
                        </h1>
                    </div>

                    <div className="space-y-4">
                        <p className="text-base md:text-lg font-medium text-gray-400 leading-relaxed max-w-3xl mx-auto">
                            Aggregated live inventory from <span className="text-gray-900 dark:text-white font-bold">{usageStats.totalSuppliers} Major Distributors.</span> One search. One result. No tab-switching required.
                        </p>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-gray-400/80">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Live B2B Pricing
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Instant Comparisons
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Automated Procurement
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row items-center gap-5 justify-center">
                        <button
                            onClick={onViewAllProducts}
                            className="group relative bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-2xl font-black text-sm hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-gray-400/20 flex items-center gap-4 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative">Explore All Hardware</span>
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        {userRole === 'admin' && (
                            <a
                                href="/admin"
                                className="px-8 py-5 rounded-2xl font-black text-sm border-2 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-3"
                            >
                                Control Center
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
                            {(usageStats.totalProducts || 15000).toLocaleString()}+
                        </span>
                        <span className="text-[10px] font-black text-gray-300 uppercase pb-2 tracking-widest">Items Synchronized</span>
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

            {/* CHANNEL INTELLIGENCE / HOW IT WORKS */}
            <div className="md:col-span-12 mt-8 py-16 px-10 bg-gray-900 dark:bg-gray-800/20 rounded-[4rem] text-center relative overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(30deg, #f97316 12%, transparent 12.5%, transparent 87%, #f97316 87.5%, #f97316), linear-gradient(150deg, #f97316 12%, transparent 12.5%, transparent 87%, #f97316 87.5%, #f97316), linear-gradient(30deg, #f97316 12%, transparent 12.5%, transparent 87%, #f97316 87.5%, #f97316), linear-gradient(150deg, #f97316 12%, transparent 12.5%, transparent 87%, #f97316 87.5%, #f97316), linear-gradient(60deg, #f97316 25%, transparent 25.5%, transparent 75%, #f97316 75%, #f97316), linear-gradient(60deg, #f97316 25%, transparent 25.5%, transparent 75%, #f97316 75%, #f97316)', backgroundSize: '80px 140px' }} />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto space-y-16">
                    <div className="space-y-4">
                        <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">One Search. Complete Clarity.</h3>
                        <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto uppercase tracking-widest text-xs">A sophisticated aggregation engine built on live data connections.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Search Instantly",
                                desc: "Type any SKU or brand in the global search bar. We query live inventory across all 6 major distributors simultaneously.",
                                icon: (
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )
                            },
                            {
                                step: "02",
                                title: "Assemble Your Order",
                                desc: "Select and add products to your cart. Compare pricing from 2+ suppliers per item to ensure you're getting the best margin.",
                                icon: (
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )
                            },
                            {
                                step: "03",
                                title: "Generate Quote",
                                desc: "Convert your cart into a professional PDF quote or a direct supplier procurement request in one click.",
                                icon: (
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )
                            }
                        ].map((item, i) => (
                            <div key={i} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <span className="text-8xl font-black italic">{item.step}</span>
                                </div>
                                <div className="mb-6 bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                    {item.icon}
                                </div>
                                <h4 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{item.title}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed font-medium relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 flex flex-col items-center gap-6">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Built for the modern MSP workflow</p>
                        <div className="w-px h-16 bg-gradient-to-b from-orange-500 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BentoDashboard;
