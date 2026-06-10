'use client';

import React from 'react';
import { UsageStats } from '../../types';

interface DashboardHeroProps {
  usageStats: UsageStats;
  onViewAllProducts: () => void;
}

export default function DashboardHero({ usageStats, onViewAllProducts }: DashboardHeroProps) {
  return (
    <div className="md:col-span-12 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 relative overflow-hidden group shadow-2xl shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-800 flex flex-col justify-center min-h-[350px] sm:min-h-[400px]">
      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 space-y-6 max-w-4xl mx-auto text-center">

        <div className="space-y-3">
          <h2 className="text-orange-500 font-black text-xl md:text-2xl tracking-tighter italic">Instant Supplier Visibility.</h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter">
            Whos Got <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Stock?</span>
          </h1>
        </div>

        <div className="space-y-4">
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed max-w-4xl mx-auto">
            The ultimate search engine for South Africa's technology distribution channel. Access live, aggregated inventory across all major IT, power, and electronic categories in one place. Stop switching tabs. Just ask: <span className="underline decoration-orange-500 decoration-3">Who's Got Stock?</span>
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
