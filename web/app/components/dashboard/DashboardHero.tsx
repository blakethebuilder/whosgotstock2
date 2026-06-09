'use client';

import React from 'react';
import { UsageStats } from '../../types';

interface DashboardHeroProps {
  usageStats: UsageStats;
  onViewAllProducts: () => void;
}

export default function DashboardHero({ usageStats, onViewAllProducts }: DashboardHeroProps) {
  return (
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
            Whos Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Stock?</span>
          </h1>
        </div>

        <div className="space-y-4">
          <p className="text-base md:text-lg font-medium text-gray-400 leading-relaxed max-w-3xl mx-auto">
            The ultimate search engine for South Africa's IT channel. Aggregated live inventory from <span className="text-gray-900 dark:text-white font-bold">{usageStats.totalSuppliers} Major Distributors.</span> Stop switching tabs. Just ask: Whos Got Stock?
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
  );
}
