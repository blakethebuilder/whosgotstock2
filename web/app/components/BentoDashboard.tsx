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
                            Find Stock, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Fast.</span>
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

            {/* DATABASE INVENTORY STATUS TILE */}
            <div className="md:col-span-4 bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between relative group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                    <svg className="w-32 h-32 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter italic">Aggregated Inventory</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Synchronized from Live Feeds</p>
                </div>
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-end pb-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Products:</span>
                        <span className="text-2xl font-black text-orange-500 tabular-nums">
                            {(usageStats.totalProducts || 12000).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In Stock Now:</span>
                        <span className="text-2xl font-black text-green-600 dark:text-green-500 tabular-nums">
                            {(usageStats.inStockProducts || 8000).toLocaleString()}
                        </span>
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

            {/* INVENTORY FLOW PIPELINE DIAGRAM */}
            <div className="md:col-span-12 mt-8 bg-gray-900 dark:bg-gray-900/60 rounded-[3rem] border border-gray-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                <div className="relative z-10 space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Live Channel Aggregator</span>
                        <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter italic">One Search. Complete Clarity.</h3>
                        <p className="text-gray-400 text-xs font-semibold leading-relaxed">How WhosGotStock maps feeds from multiple B2B distributors into one instantaneous query index.</p>
                    </div>

                    {/* CSS Diagram Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-11 items-center gap-6 py-6 border-y border-gray-800 bg-gray-950/30 rounded-[2.5rem] p-6">
                        {/* Column 1: Supplier Nodes (4 cols) */}
                        <div className="lg:col-span-4 space-y-3">
                            <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider block text-center lg:text-left mb-2">Ingestion Sources</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                                {[
                                    { name: 'Esquire', type: 'XML API' },
                                    { name: 'Scoop', type: 'JSON API' },
                                    { name: 'Pinnacle', type: 'XML Feed' },
                                    { name: 'Syntech', type: 'JSON API' },
                                    { name: 'Mustek', type: 'XML Feed' },
                                    { name: 'Even Flow', type: 'Paginated JSON' },
                                    { name: 'Linkqage', type: 'JSON API' }
                                ].map(s => (
                                    <div key={s.name} className="flex items-center gap-2 px-3 py-2 bg-gray-900/80 border border-gray-800 rounded-xl">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0" />
                                        <div className="min-w-0 flex-1 text-left">
                                            <div className="text-[10px] font-black text-white uppercase tracking-wider leading-none">{s.name}</div>
                                            <div className="text-[8px] font-bold text-gray-500 uppercase mt-0.5 tracking-tight">{s.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Pipelines & Flows (3 cols) */}
                        <div className="lg:col-span-3 flex flex-row lg:flex-col items-center justify-center gap-4 py-4 lg:py-0">
                            <div className="h-[2px] w-12 lg:w-[2px] lg:h-12 bg-gradient-to-r lg:bg-gradient-to-b from-orange-500 to-transparent animate-pulse" />
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center max-w-[180px] shadow-xl">
                                <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block mb-1">Scraper Engines</span>
                                <div className="text-[11px] font-black text-orange-500 uppercase tracking-wider animate-bounce">Concurrently Syncing</div>
                                <span className="text-[8px] text-gray-500 block mt-1 font-semibold">Every 60 Mins</span>
                            </div>
                            <div className="h-[2px] w-12 lg:w-[2px] lg:h-12 bg-gradient-to-r lg:bg-gradient-to-b from-transparent to-orange-500 animate-pulse" />
                        </div>

                        {/* Column 3: Unified Index Hub (4 cols) */}
                        <div className="lg:col-span-4 bg-gray-900/60 border border-orange-500/20 rounded-3xl p-6 text-center space-y-4 shadow-2xl shadow-orange-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-300" />
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Unified Query Index</h4>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Trigram Search (pg_trgm)</p>
                            </div>
                            <div className="space-y-1 text-left text-[9px] font-semibold text-gray-405 border-t border-gray-800 pt-3 max-w-[200px] mx-auto">
                                <div className="flex justify-between">
                                    <span>Search Speed:</span>
                                    <span className="text-green-500 font-bold">&lt; 15ms</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sync Status:</span>
                                    <span className="text-green-500 font-bold">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step descriptions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                        {[
                            {
                                step: "01",
                                title: "Query Live Stock",
                                desc: "Run a single keyword search. The unified query index instantly matches name, SKU, and brands across all synchronized nodes."
                            },
                            {
                                step: "02",
                                title: "Compare & Assign",
                                desc: "Assemble multiple supplier items, assign them to custom sites, and compare distributor costs directly within the drawer."
                            },
                            {
                                step: "03",
                                title: "Generate Orders",
                                desc: "Compile structured supplier email templates grouped by site packages for instant B2B order placements."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-gray-950/40 border border-gray-800/80 text-left relative overflow-hidden group hover:border-gray-700 transition-colors">
                                <div className="absolute -right-2 -top-2 opacity-5">
                                    <span className="text-6xl font-black italic">{item.step}</span>
                                </div>
                                <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">{item.title}</h4>
                                <p className="text-gray-400 text-xs font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PROFESSIONAL FOOTER */}
            <footer className="md:col-span-12 mt-16 pt-12 border-t border-gray-200 dark:border-gray-800 text-center sm:text-left">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <span className="text-gray-900 dark:text-white font-black text-sm tracking-tighter uppercase">
                            WHOSGOT<span className="text-orange-500 ml-0.5">STOCK</span>
                        </span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed max-w-xs">
                            South Africa's premier unified IT hardware sourcing aggregator. Instant pricing, inventory matching, and multi-supplier quote packaging.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Channel Suppliers</h4>
                        <ul className="space-y-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <li>Esquire Technologies</li>
                            <li>Pinnacle Micro</li>
                            <li>Syntech Distribution</li>
                            <li>Mustek Limited</li>
                            <li>Scoop Distribution</li>
                            <li>Linkqage / Even Flow</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Platform Info</h4>
                        <ul className="space-y-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                            <li>Real-time Live Sync</li>
                            <li>Dynamic Site Packages</li>
                            <li>Role-Based Markup Tiers</li>
                            <li>Developer API Sourcing</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Access & Support</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                            Authorized IT reseller channel access only. Reseller registration verified via ICASA / company credentials.
                        </p>
                    </div>
                </div>
                <div className="pt-6 border-t border-gray-100 dark:border-gray-850 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>© {new Date().getFullYear()} WhosGotStock. All rights reserved.</span>
                    <div className="flex gap-4">
                        <a href="/login" className="hover:text-orange-500 transition-colors">Reseller Access</a>
                        <span>•</span>
                        <a href="/admin" className="hover:text-orange-500 transition-colors">Console Link</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BentoDashboard;
