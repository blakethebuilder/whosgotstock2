'use client';

import React from 'react';
import CategoryTiles from './CategoryTiles';
import { Supplier, UserRole, UsageStats } from '../types';
import DashboardHero from './dashboard/DashboardHero';
import PipelineFlowDiagram from './dashboard/PipelineFlowDiagram';
import Footer from '../components/Footer';

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
            <DashboardHero usageStats={usageStats} onViewAllProducts={onViewAllProducts} />

            {/* INTEGRATED SUPPLIERS TILE */}
            <div className="md:col-span-4 bg-gradient-to-br from-[#D8E698] to-[#C5D67A] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col justify-between group cursor-pointer hover:shadow-2xl hover:shadow-[#D8E698]/30 transition-all border border-white/20">
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
            <div className="md:col-span-4 bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 flex flex-col justify-between relative group">
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
                className="md:col-span-4 bg-[#FF6B6B] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 flex flex-col justify-between group cursor-pointer relative overflow-hidden hover:brightness-105 transition-all shadow-2xl shadow-red-200/50"
            >
                <div className="absolute -right-8 -bottom-8 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <span className="bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/15">
                            Click to Open
                        </span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white leading-tight tracking-tighter italic">Category Directory</h3>
                        <p className="text-red-100 text-xs font-semibold mt-2 opacity-90">
                            Drill down into structured departments, product families, and specialized categories.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        <span>Browse Index</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </div>
            </div>

            {/* QUICK TAGS / COLLECTIONS */}
            <div className="md:col-span-12 bg-white dark:bg-gray-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-white/40 dark:border-gray-800/40 shadow-xl shadow-gray-200/40 min-h-[250px] relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Curated Collections</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Instant filtering for top hardware</p>
                    </div>
                    <button
                        onClick={onShowCategoryBrowser}
                        className="group flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-500 transition-all border border-gray-100 dark:border-gray-700 w-full sm:w-auto"
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
            <PipelineFlowDiagram />

            {/* PROFESSIONAL FOOTER */}
            <Footer />
        </div>
    );
};

export default BentoDashboard;
