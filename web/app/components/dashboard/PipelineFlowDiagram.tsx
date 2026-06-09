'use client';

import React, { useState, useEffect } from 'react';

interface SupplierState {
  name: string;
  slug: string;
  status: 'idle' | 'pinging' | 'success' | 'empty';
  latency?: number;
  count?: number;
}

interface SimulatedProduct {
  sku: string;
  name: string;
  brand: string;
  qty: number;
  priceEx: number;
  supplier: string;
}

const PRESETS = [
  {
    query: 'Ubiquiti Switch',
    sku: 'USW-24-POE',
    brand: 'Ubiquiti',
    category: 'Networking',
    suppliers: [
      { name: 'Linkqage', slug: 'linkqage', latency: 112, count: 4 },
      { name: 'Rectron', slug: 'rectron', latency: 85, count: 0 },
      { name: 'Pinnacle', slug: 'pinnacle', latency: 142, count: 2 },
      { name: 'Scoop Distribution', slug: 'scoop', latency: 98, count: 3 }
    ],
    results: [
      { sku: 'USW-24-POE', name: 'UniFi 24-Port Gigabit PoE Switch', brand: 'Ubiquiti', qty: 14, priceEx: 7850, supplier: 'Linkqage' },
      { sku: 'USW-24-POE', name: 'USW-24-POE UniFi 24 Port PoE Switch', brand: 'Ubiquiti', qty: 8, priceEx: 7990, supplier: 'Scoop Distribution' },
      { sku: 'USW-24-POE', name: 'Ubiquiti UniFi 24-Port PoE Switch 95W', brand: 'Ubiquiti', qty: 3, priceEx: 7799, supplier: 'Pinnacle' }
    ]
  },
  {
    query: 'Cat6 Cable 3m',
    sku: 'FL-C6-3M',
    brand: 'Linkqage Brand',
    category: 'Cabling',
    suppliers: [
      { name: 'Linkqage', slug: 'linkqage', latency: 64, count: 8 },
      { name: 'Rectron', slug: 'rectron', latency: 72, count: 2 },
      { name: 'Pinnacle', slug: 'pinnacle', latency: 120, count: 0 },
      { name: 'Scoop Distribution', slug: 'scoop', latency: 105, count: 4 }
    ],
    results: [
      { sku: 'FL-C6-3M-BL', name: 'Cat6 Flylead UTP 3m Blue Molded', brand: 'Linkqage', qty: 450, priceEx: 45, supplier: 'Linkqage' },
      { sku: 'FL-C6-3M-GY', name: 'Cat6 Flylead UTP 3m Grey Molded', brand: 'Linkqage', qty: 290, priceEx: 45, supplier: 'Linkqage' },
      { sku: 'CAB-C6-3M', name: 'Scoop Cat6 UTP Patch Cord 3m', brand: 'Scoop', qty: 125, priceEx: 39, supplier: 'Scoop Distribution' }
    ]
  },
  {
    query: 'Intel Core i7 CPU',
    sku: 'BX8071512700',
    brand: 'Intel',
    category: 'Processors',
    suppliers: [
      { name: 'Linkqage', slug: 'linkqage', latency: 95, count: 0 },
      { name: 'Rectron', slug: 'rectron', latency: 110, count: 6 },
      { name: 'Pinnacle', slug: 'pinnacle', latency: 135, count: 4 },
      { name: 'Scoop Distribution', slug: 'scoop', latency: 80, count: 0 }
    ],
    results: [
      { sku: 'BX8071512700', name: 'Intel Core i7-12700 12-Core Processor', brand: 'Intel', qty: 22, priceEx: 6200, supplier: 'Rectron' },
      { sku: 'BX8071512700', name: 'Intel Core i7-12700 CPU Boxed', brand: 'Intel', qty: 15, priceEx: 6150, supplier: 'Pinnacle' }
    ]
  }
];

export default function PipelineFlowDiagram() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [pipelineState, setPipelineState] = useState<'idle' | 'parsing' | 'querying' | 'matching' | 'complete'>('idle');
  const [simulatedQuery, setSimulatedQuery] = useState(PRESETS[0].query);
  const [suppliers, setSuppliers] = useState<SupplierState[]>([]);
  const [results, setResults] = useState<SimulatedProduct[]>([]);
  const [matchedSku, setMatchedSku] = useState('');

  const currentPreset = PRESETS[selectedPresetIndex];

  const startSimulation = (presetIdx: number) => {
    setSelectedPresetIndex(presetIdx);
    const preset = PRESETS[presetIdx];
    setSimulatedQuery(preset.query);
    setPipelineState('parsing');
    setResults([]);
    setMatchedSku('');

    // Reset suppliers status
    setSuppliers(preset.suppliers.map(s => ({
      name: s.name,
      slug: s.slug,
      status: 'idle'
    })));

    // Step 1: Parsing Query (1.2 seconds)
    setTimeout(() => {
      setPipelineState('querying');
      
      // Step 2: Querying Suppliers Parallel triggers
      preset.suppliers.forEach((s, idx) => {
        // Stagger the ping animation slightly for visual effect
        setTimeout(() => {
          setSuppliers(prev => prev.map(item => 
            item.name === s.name ? { ...item, status: 'pinging' } : item
          ));

          // Resolve query state
          setTimeout(() => {
            setSuppliers(prev => prev.map(item => 
              item.name === s.name ? {
                ...item,
                status: s.count > 0 ? 'success' : 'empty',
                latency: s.latency,
                count: s.count
              } : item
            ));
          }, s.latency * 3.5); // artificial scale factor to make it look organic

        }, idx * 150);
      });

      // Step 3: Match & Deduplicate when queries finish
      setTimeout(() => {
        setPipelineState('matching');
        setMatchedSku(preset.sku);

        // Step 4: Finished results
        setTimeout(() => {
          setPipelineState('complete');
          setResults(preset.results);
        }, 1200);

      }, 1600);

    }, 1200);
  };

  useEffect(() => {
    // Run simulation automatically on mount
    startSimulation(0);
  }, []);

  return (
    <div className="md:col-span-12 mt-8 bg-gray-900 dark:bg-gray-900/60 rounded-[3rem] border border-gray-800 p-6 sm:p-12 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 space-y-8">
        
        {/* Header Summary */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            Real-Time Engine Visualizer
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tighter italic">
            Behind the Search Bar
          </h3>
          <p className="text-gray-400 text-xs font-semibold leading-relaxed">
            See how WhosGotStock orchestrates concurrent supplier API queries, normalizes item descriptions, and filters markup in under 2 seconds.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => startSimulation(idx)}
              disabled={pipelineState !== 'idle' && pipelineState !== 'complete'}
              className={`px-4 py-2 text-xs font-bold rounded-2xl border transition-all ${
                selectedPresetIndex === idx
                  ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              } disabled:opacity-50`}
            >
              🔍 "{p.query}"
            </button>
          ))}
        </div>

        {/* Dynamic Visualizer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-6 border-t border-gray-800/80">
          
          {/* Step 1 & 2: Search Pipeline Operations */}
          <div className="lg:col-span-7 bg-gray-950/40 border border-gray-800/60 rounded-[2rem] p-6 flex flex-col justify-between space-y-6">
            
            {/* Simulation Steps Indicator */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-800/60">
              <span className="text-xs font-bold text-gray-400">Pipeline Pipeline Flow</span>
              <div className="flex gap-1.5">
                {['parsing', 'querying', 'matching', 'complete'].map((step, i) => {
                  const states = ['parsing', 'querying', 'matching', 'complete'];
                  const curIdx = states.indexOf(pipelineState);
                  const stepIdx = states.indexOf(step);
                  const isDone = curIdx >= stepIdx;
                  const isActive = pipelineState === step;

                  return (
                    <span
                      key={step}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                        isActive 
                          ? 'bg-orange-500 text-white animate-pulse'
                          : isDone 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live Query Bar */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-500">1. Query Analysis</label>
              <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5">
                <span className="text-orange-500 animate-pulse">⚡</span>
                <span className="text-sm font-bold text-white font-mono">{simulatedQuery}</span>
                {pipelineState === 'parsing' && (
                  <span className="ml-auto text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                    Parsing SKUs...
                  </span>
                )}
              </div>

              {/* Parsed Meta Tags */}
              <div className="flex gap-2 flex-wrap min-h-[28px] pt-1">
                {pipelineState !== 'idle' && (
                  <>
                    <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 rounded-md uppercase">
                      Query: {currentPreset.query}
                    </span>
                    {pipelineState !== 'parsing' && (
                      <>
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 rounded-md uppercase">
                          Target SKU: {currentPreset.sku}
                        </span>
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-400 rounded-md uppercase">
                          Category: {currentPreset.category}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Parallel Scrapers Simulation */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-black tracking-wider text-gray-500">2. Live Sourcing Broadcast (Concurrent Requests)</label>
                {pipelineState === 'querying' && (
                  <span className="text-[9px] text-green-500 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Firing Parallel API Pings
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {suppliers.map((sup) => (
                  <div
                    key={sup.name}
                    className={`p-3 rounded-xl border transition-all duration-300 ${
                      sup.status === 'success'
                        ? 'bg-green-500/5 border-green-500/20'
                        : sup.status === 'empty'
                          ? 'bg-gray-900 border-gray-800 opacity-60'
                          : sup.status === 'pinging'
                            ? 'bg-orange-500/5 border-orange-500/30 shadow-lg shadow-orange-500/5 animate-pulse'
                            : 'bg-gray-900/40 border-gray-850 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{sup.name}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        sup.status === 'success'
                          ? 'bg-green-500'
                          : sup.status === 'empty'
                            ? 'bg-yellow-500'
                            : sup.status === 'pinging'
                              ? 'bg-orange-500'
                              : 'bg-gray-700'
                      }`} />
                    </div>
                    <div className="flex justify-between items-center mt-2.5 text-[10px] font-semibold text-gray-400">
                      <span>Status:</span>
                      <span className="font-bold text-white capitalize">
                        {sup.status === 'idle' ? 'Idle' : sup.status === 'pinging' ? 'Querying...' : sup.status === 'success' ? 'Matches Found' : 'No Stocks'}
                      </span>
                    </div>
                    {sup.status === 'success' && (
                      <div className="flex justify-between items-center mt-1 text-[10px] font-semibold text-gray-500">
                        <span>Latency:</span>
                        <span className="text-green-400 font-black">{sup.latency}ms</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Deduplication & Matching Logic */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] uppercase font-black tracking-wider text-gray-500">3. Match Consolidation & Margins</label>
              <div className="bg-gray-900/80 border border-gray-850 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Cross-Supplier Deduplication:</span>
                  {pipelineState === 'matching' || pipelineState === 'complete' ? (
                    <span className="text-green-500 font-bold flex items-center gap-1">
                      ✅ Found SKU {matchedSku}
                    </span>
                  ) : (
                    <span className="text-gray-600 italic">Waiting...</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Fuzzy Match Accuracy:</span>
                  {pipelineState === 'matching' || pipelineState === 'complete' ? (
                    <span className="text-white font-bold">100% SKU Align</span>
                  ) : (
                    <span className="text-gray-600 italic">Waiting...</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Pricing Normalization:</span>
                  {pipelineState === 'matching' || pipelineState === 'complete' ? (
                    <span className="text-orange-500 font-bold">Standardized VAT & Feed</span>
                  ) : (
                    <span className="text-gray-600 italic">Waiting...</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Step 3: Normalized Output Feed */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gray-950/40 border border-gray-800/60 rounded-[2rem] p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-black tracking-wider text-gray-500">Combined Live Results</label>
                {pipelineState === 'complete' && (
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black">
                    {results.length} Matches Sorted
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Overlap mapped items are grouped side-by-side so you immediately see who has stock and where pricing is lowest.
              </p>
            </div>

            {/* Results Grid Container */}
            <div className="flex-1 min-h-[280px] bg-gray-900 border border-gray-850 rounded-2xl p-4 flex flex-col justify-center gap-3">
              {pipelineState !== 'complete' ? (
                <div className="text-center py-10 space-y-3">
                  <div className="relative inline-flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    {pipelineState === 'idle' && 'Select a preset above to begin...'}
                    {pipelineState === 'parsing' && 'Parsing search tokens...'}
                    {pipelineState === 'querying' && 'Pinging distributor database inventories...'}
                    {pipelineState === 'matching' && 'Matching products & calculating markups...'}
                  </p>
                </div>
              ) : (
                results.map((product, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-950 rounded-xl border border-gray-850 flex items-center justify-between gap-3 animate-fade-in hover:border-gray-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-500">{product.brand}</span>
                        <span className="text-[9px] font-mono text-gray-500">{product.sku}</span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate">{product.name}</h5>
                      <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400">
                        <span>Source:</span>
                        <span className="text-white bg-gray-800 px-1.5 py-0.5 rounded">{product.supplier}</span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-white">R {product.priceEx.toLocaleString()}</div>
                      <div className={`text-[9px] font-black ${product.qty > 50 ? 'text-green-500' : 'text-orange-500'}`}>
                        {product.qty} in stock
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                onClick={() => startSimulation(selectedPresetIndex)}
                disabled={pipelineState !== 'complete'}
                className="w-full py-2.5 bg-gray-900 border border-gray-850 rounded-xl text-xs font-bold text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                🔁 Re-run Sourcing Simulation
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
