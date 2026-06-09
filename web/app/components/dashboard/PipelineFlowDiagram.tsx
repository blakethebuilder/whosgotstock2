'use client';

import React from 'react';

export default function PipelineFlowDiagram() {
  return (
    <div className="md:col-span-12 mt-8 bg-gray-900 dark:bg-gray-900/60 rounded-[3rem] border border-gray-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="relative z-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Unified Search Pipeline</span>
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter italic">One Search. Complete Clarity.</h3>
          <p className="text-gray-400 text-xs font-semibold leading-relaxed">How WhosGotStock maps and aggregates live channel inventories into one instantaneous sourcing results page.</p>
        </div>

        {/* CSS Diagram Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch py-8 border-y border-gray-800 bg-gray-950/30 rounded-[2.5rem] p-8">
          {/* Step 1: Input / Search Query */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <svg className="w-24 h-24 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-[9px] font-black uppercase text-orange-500 tracking-wider rounded-full">
                Step 01
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-wider">1. Enter Query</h4>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                Type a brand name, category, SKU, or generic hardware keyword in the search bar.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/60 space-y-2">
              <div className="bg-gray-950 rounded-xl px-3 py-2 text-[10px] text-gray-500 font-mono flex items-center gap-2 border border-gray-800">
                <span className="text-orange-500 font-bold">$</span> search "cat6 cable"
              </div>
              <div className="bg-gray-950 rounded-xl px-3 py-2 text-[10px] text-gray-500 font-mono flex items-center gap-2 border border-gray-800">
                <span className="text-orange-500 font-bold">$</span> SKU "core-i7-12700"
              </div>
            </div>
          </div>

          {/* Step 2: Concurrently Querying Feeds & Fuzzy Match */}
          <div className="bg-gray-900/60 border border-orange-500/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-orange-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <svg className="w-24 h-24 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-[9px] font-black uppercase text-green-500 tracking-wider rounded-full">
                Step 02
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-wider">2. Search Pipeline</h4>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                The engine concurrently queries live stock levels and pricing, matching descriptions, SKU variants, and brand alignments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/60 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                <span>Sync Status:</span>
                <span className="text-green-500 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                <span>Trigram Match Speed:</span>
                <span className="text-orange-500 font-bold">&lt; 15ms</span>
              </div>
            </div>
          </div>

          {/* Step 3: Compare & Build Quote */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <svg className="w-24 h-24 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase text-blue-500 tracking-wider rounded-full">
                Step 03
              </div>
              <h4 className="text-base font-black text-white uppercase tracking-wider">3. Compare & Quote</h4>
              <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                Select the lowest price or best stock location, add to your site quotes, and generate procurement emails.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/60 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                <span>Multi-Supplier:</span>
                <span className="text-white font-black">Active</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                <span>Markup Engine:</span>
                <span className="text-white font-black">Automated</span>
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
  );
}
