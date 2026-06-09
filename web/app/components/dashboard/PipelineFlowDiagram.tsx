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
      { name: 'Scoop Distribution', slug: 'scoop', latency: 98, count: 3 },
      { name: 'Syntech', slug: 'syntech', latency: 120, count: 0 },
      { name: 'Mustek', slug: 'mustek', latency: 150, count: 0 },
      { name: 'Esquire', slug: 'esquire', latency: 130, count: 0 }
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
      { name: 'Scoop Distribution', slug: 'scoop', latency: 105, count: 4 },
      { name: 'Syntech', slug: 'syntech', latency: 90, count: 1 },
      { name: 'Mustek', slug: 'mustek', latency: 110, count: 0 },
      { name: 'Esquire', slug: 'esquire', latency: 115, count: 0 }
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
      { name: 'Scoop Distribution', slug: 'scoop', latency: 80, count: 0 },
      { name: 'Syntech', slug: 'syntech', latency: 100, count: 0 },
      { name: 'Mustek', slug: 'mustek', latency: 125, count: 2 },
      { name: 'Esquire', slug: 'esquire', latency: 140, count: 1 }
    ],
    results: [
      { sku: 'BX8071512700', name: 'Intel Core i7-12700 12-Core Processor', brand: 'Intel', qty: 22, priceEx: 6200, supplier: 'Rectron' },
      { sku: 'BX8071512700', name: 'Intel Core i7-12700 CPU Boxed', brand: 'Intel', qty: 15, priceEx: 6150, supplier: 'Pinnacle' },
      { sku: 'BX8071512700', name: 'Intel i7-12700 Processor Retail Pack', brand: 'Intel', qty: 2, priceEx: 6350, supplier: 'Mustek' }
    ]
  }
];

// Layout coordinates for 7 suppliers surrounding the center (50%, 50%)
const SUPPLIER_POSITIONS = [
  { name: 'Linkqage', x: '18%', y: '22%' },
  { name: 'Pinnacle', x: '82%', y: '22%' },
  { name: 'Scoop Distribution', x: '16%', y: '50%' },
  { name: 'Rectron', x: '84%', y: '50%' },
  { name: 'Syntech', x: '18%', y: '78%' },
  { name: 'Mustek', x: '82%', y: '78%' },
  { name: 'Esquire', x: '50%', y: '16%' }
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

        }, idx * 100);
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
      <style>{`
        @keyframes pulseFlow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 space-y-8">
        
        {/* Header Summary */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tighter italic">
            Behind the Search Bar
          </h3>
          <p className="text-gray-400 text-xs font-semibold leading-relaxed">
            See how WhosGotStock orchestrates concurrent supplier API queries, normalizes item descriptions, and aggregates live stock matches in under 2 seconds.
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
          
          {/* Mindmap Panel */}
          <div className="lg:col-span-7 bg-gray-950/40 border border-gray-800/60 rounded-[2rem] p-6 flex flex-col justify-between relative min-h-[480px]">
            
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {SUPPLIER_POSITIONS.map((pos) => {
                const supplierState = suppliers.find(s => s.name === pos.name) || { status: 'idle' };
                const isPinging = supplierState.status === 'pinging';
                const isSuccess = supplierState.status === 'success';
                const isEmpty = supplierState.status === 'empty';
                
                let strokeColor = 'rgba(75, 85, 99, 0.2)'; // Gray muted
                if (isPinging) strokeColor = '#f97316'; // Orange
                else if (isSuccess) strokeColor = '#22c55e'; // Green
                else if (isEmpty) strokeColor = 'rgba(234, 179, 8, 0.4)'; // Yellow-orange dim

                return (
                  <g key={pos.name}>
                    {/* Primary link line */}
                    <line
                      x1="50%"
                      y1="50%"
                      x2={pos.x}
                      y2={pos.y}
                      stroke={strokeColor}
                      strokeWidth={isPinging || isSuccess ? 2.5 : 1.5}
                      className="transition-colors duration-300"
                    />
                    {/* Animated pulse flow */}
                    {(isPinging || isSuccess) && (
                      <line
                        x1="50%"
                        y1="50%"
                        x2={pos.x}
                        y2={pos.y}
                        stroke={isSuccess ? '#22c55e' : '#f97316'}
                        strokeWidth={2.5}
                        strokeDasharray="8, 8"
                        style={{
                          animation: 'pulseFlow 0.8s linear infinite',
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Mindmap Nodes */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              
              {/* Central Search Bar Node */}
              <div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-60 bg-gray-900 border border-gray-700/80 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-1.5 text-center transition-all duration-300 pointer-events-auto"
                style={{ boxShadow: '0 0 35px rgba(249, 115, 22, 0.15)' }}
              >
                <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 rounded-lg px-2.5 py-1.5 w-full">
                  <span className="text-orange-500 text-xs animate-pulse">⚡</span>
                  <span className="text-[11px] font-bold text-white font-mono truncate">{simulatedQuery}</span>
                </div>
                
                <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">
                  {pipelineState === 'idle' && 'Ready'}
                  {pipelineState === 'parsing' && 'Parsing Query...'}
                  {pipelineState === 'querying' && 'Broadcasting Queries'}
                  {pipelineState === 'matching' && 'Matching Inventory'}
                  {pipelineState === 'complete' && 'Results Normalized'}
                </span>
              </div>

              {/* Surrounding Supplier Nodes */}
              {SUPPLIER_POSITIONS.map((pos) => {
                const sup = suppliers.find(s => s.name === pos.name) || { name: pos.name, status: 'idle', count: 0, latency: 0 };
                const isIdle = sup.status === 'idle';
                const isPinging = sup.status === 'pinging';
                const isSuccess = sup.status === 'success';
                const isEmpty = sup.status === 'empty';

                return (
                  <div
                    key={pos.name}
                    style={{ left: pos.x, top: pos.y }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border flex flex-col items-center gap-1 w-24 sm:w-28 text-center transition-all duration-300 pointer-events-auto ${
                      isSuccess
                        ? 'bg-green-950/90 border-green-500/40 shadow-lg shadow-green-500/10 scale-105'
                        : isEmpty
                        ? 'bg-gray-900/90 border-yellow-600/30 opacity-70'
                        : isPinging
                        ? 'bg-orange-950/90 border-orange-500/50 shadow-lg shadow-orange-500/10 scale-105 animate-pulse'
                        : 'bg-gray-950/70 border-gray-850 opacity-40'
                    }`}
                  >
                    <span className="text-[10px] font-black text-white truncate max-w-full">
                      {pos.name.replace(' Distribution', '')}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isSuccess ? 'bg-green-500' : isEmpty ? 'bg-yellow-500' : isPinging ? 'bg-orange-500' : 'bg-gray-600'
                      }`} />
                      <span className="text-[8px] font-bold text-gray-400 capitalize">
                        {isIdle && 'Idle'}
                        {isPinging && 'Pinging'}
                        {isSuccess && `${sup.count} hits`}
                        {isEmpty && 'No stock'}
                      </span>
                    </div>

                    {isSuccess && sup.latency && (
                      <span className="text-[8px] font-black text-green-400 leading-none">
                        {sup.latency}ms
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom normalization status widget */}
            <div className="relative z-20 mt-auto bg-gray-900/80 border border-gray-850 rounded-2xl p-4 grid grid-cols-2 gap-4 text-[11px] backdrop-blur-sm">
              <div className="space-y-1">
                <div className="text-gray-400 font-medium">Cross-Supplier Deduplication:</div>
                <div className="font-bold text-white">
                  {pipelineState === 'matching' || pipelineState === 'complete' ? (
                    <span className="text-green-500">✅ Found SKU {matchedSku}</span>
                  ) : (
                    <span className="text-gray-600 italic">Waiting...</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-400 font-medium">Pricing Normalization:</div>
                <div className="font-bold text-white">
                  {pipelineState === 'matching' || pipelineState === 'complete' ? (
                    <span className="text-orange-500">Standardized VAT & Feed</span>
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
                    {pipelineState === 'matching' && 'Matching products...'}
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

