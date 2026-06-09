'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ArbitrageAnomaly {
  sku: string;
  name: string;
  min_p: string | number;
  max_p: string | number;
  v_pct: string | number;
  low_s: string;
  high_s: string;
}

interface VelocityAnomaly {
  sku: string;
  name: string;
  cat: string;
  qty_sold: string | number;
  cur_stk: string | number;
}

interface ResurrectionAnomaly {
  sku: string;
  name: string;
  cur_stk: string | number;
}

interface SnapshotData {
  price_arb: ArbitrageAnomaly[];
  sc_velocity: VelocityAnomaly[];
  resurrect: ResurrectionAnomaly[];
  ts: string;
}

export default function ChannelIntelligencePage() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Default header token matching route authentication
  const HERMES_TOKEN = 'hermes_sec_auth_token_2026';

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/marketing-snapshot', {
        headers: {
          'Authorization': `Bearer ${HERMES_TOKEN}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load snapshot. Status: ${res.status}`);
      }
      const snapshot: SnapshotData = await res.json();
      setData(snapshot);
      
      // Auto-generate initial drafts when data is fetched
      generateSocialDrafts(snapshot);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch channel anomalies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, []);

  const generateSocialDrafts = (snapshot: SnapshotData) => {
    setDrafting(true);
    
    // Simulate Hermes B2B copywriter generation delay
    setTimeout(() => {
      const generatedDrafts: string[] = [];

      // 1. Price Arbitrage Post
      if (snapshot.price_arb && snapshot.price_arb.length > 0) {
        const topArb = snapshot.price_arb[0];
        generatedDrafts.push(
          `📢 PROCUREMENT ALERT: South African ICT Channel Arbitrage detected!\n\n` +
          `We found a massive ${topArb.v_pct}% price variance on the "${topArb.name}" (SKU: ${topArb.sku}) across local distributors.\n\n` +
          `💰 Lowest cost: R${Number(topArb.min_p).toLocaleString()} (${topArb.low_s})\n` +
          `📈 Highest cost: R${Number(topArb.max_p).toLocaleString()} (${topArb.high_s})\n\n` +
          `Stop leaking margins. Always search before quoting. #ITProcurement #SouthAfricaTech #ICTResellers #WhosGotStock`
        );
      } else {
        generatedDrafts.push(
          `📢 MARKET INSIGHT: B2B Procurement margins are tightening in South African hardware channels.\n\n` +
          `Optimize your supply network by sourcing directly from verified tier-1 distributors. Standardize feeds and bypass markups automatically.\n\n` +
          `#ITProcurement #ICTReseller #WhosGotStock`
        );
      }

      // 2. Supply Chain Velocity Post
      if (snapshot.sc_velocity && snapshot.sc_velocity.length > 0) {
        const topVel = snapshot.sc_velocity[0];
        generatedDrafts.push(
          `⚡ SUPPLY CHAIN MOVEMENT: High velocity detected in the "${topVel.cat}" category.\n\n` +
          `Our weekly tracking shows "${topVel.name}" (SKU: ${topVel.sku}) lead the sales charts with an implied drop of ${topVel.qty_sold} stock units over the trailing 7 days.\n\n` +
          `📦 Current distributor stock: ${topVel.cur_stk} units.\n\n` +
          `Demand is surging for infrastructure and power equipment in South Africa. Secure your allocation now. #SupplyChain #Networking #PowerSourcing #B2BHardware`
        );
      } else {
        generatedDrafts.push(
          `⚡ SUPPLY CHAIN MOVEMENT: Power and Networking items are experiencing high velocity in South African distribution channels.\n\n` +
          `Resellers are advised to secure inventory allocations early as shipping times fluctuate.\n\n` +
          `#SupplyChain #Networking #ITHardware`
        );
      }

      // 3. Resurrection Post
      if (snapshot.resurrect && snapshot.resurrect.length > 0) {
        const topRes = snapshot.resurrect[0];
        generatedDrafts.push(
          `🔥 BACK IN STOCK: Dry spell ends for high-demand hardware!\n\n` +
          `After being completely out-of-stock across all SA distributors for over 14 consecutive days, the "${topRes.name}" (SKU: ${topRes.sku}) has received a fresh injection of ${topRes.cur_stk} units in the last 48 hours.\n\n` +
          `Act fast to secure these units for pending client quotes. #BackInStock #ITDistribution #MSPReseller #WhosGotStock`
        );
      } else {
        generatedDrafts.push(
          `🔥 BACK IN STOCK: High-demand processor and cabling stock is beginning to land at local warehouses after trailing logistics backlogs.\n\n` +
          `Search live feeds to instantly locate fresh allocations. #HardwareInStock #ITProcurement`
        );
      }

      setDrafts(generatedDrafts);
      setDrafting(false);
    }, 800);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper values for High-level metrics cards
  const getTopArbitrageVariance = () => {
    if (!data?.price_arb || data.price_arb.length === 0) return '0%';
    const top = data.price_arb[0];
    return `${top.v_pct}% on ${top.sku}`;
  };

  const getTopVelocityDrop = () => {
    if (!data?.sc_velocity || data.sc_velocity.length === 0) return '0 units';
    const top = data.sc_velocity[0];
    return `-${top.qty_sold} units on ${top.sku}`;
  };

  const getTotalResurrections = () => {
    if (!data?.resurrect) return 0;
    return data.resurrect.length;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Decorative Blur Background Gimmick */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <Link href="/admin" className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
              ← Return to Admin Panel
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-white italic">
              Channel Intelligence & Social Engine
            </h1>
            <p className="text-slate-400 text-xs">
              Automated anomaly discovery and content pipeline targeting South African procurement channels.
            </p>
          </div>
          
          <button
            onClick={fetchSnapshot}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-white transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Querying Postgres...
              </>
            ) : (
              <>
                <span>🔁 Re-run Analytics</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold">
            ⚠️ Error: {error}
          </div>
        )}

        {/* Top Row: Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Pricing Arbitrage */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deepest Price Arbitrage</span>
            {loading ? (
              <div className="h-8 w-2/3 bg-slate-800 rounded animate-pulse mt-2" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-orange-500 mt-2 truncate">
                {getTopArbitrageVariance()}
              </h3>
            )}
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Highest distributor pricing margin variance found today.</p>
          </div>

          {/* Card 2: Stock Velocity */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sharpest trailing 7d stock drop</span>
            {loading ? (
              <div className="h-8 w-2/3 bg-slate-800 rounded animate-pulse mt-2" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-red-500 mt-2 truncate">
                {getTopVelocityDrop()}
              </h3>
            )}
            <p className="text-[10px] text-slate-500 font-semibold mt-1">High demand velocity drop in Power & Networking products.</p>
          </div>

          {/* Card 3: Fresh Arrivals */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-green-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fresh Stock Resurrections</span>
            {loading ? (
              <div className="h-8 w-2/3 bg-slate-800 rounded animate-pulse mt-2" />
            ) : (
              <h3 className="text-xl sm:text-2xl font-black text-green-500 mt-2">
                {getTotalResurrections()} items landed
              </h3>
            )}
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Items moving from consecutive 0-stock dry spells into availability.</p>
          </div>
        </div>

        {/* Middle Section: Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tables Panel (Left Columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Table A: Live Price Arbitrage */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">Table A: Live Price Arbitrage Anomalies</h2>
                  <p className="text-[11px] text-slate-400">SKUs in stock at $\ge 2$ suppliers showcasing maximum price variances.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-850">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Lowest Cost</th>
                      <th className="py-2.5 px-3">Highest Cost</th>
                      <th className="py-2.5 px-3 text-right">Variance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-36 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-20 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-20 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-10 bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : !data?.price_arb || data.price_arb.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 italic">No arbitrage anomalies detected today.</td>
                      </tr>
                    ) : (
                      data.price_arb.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400 whitespace-nowrap">{item.sku}</td>
                          <td className="py-2.5 px-3 font-semibold truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>{item.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white">R{Number(item.min_p).toLocaleString()}</span>
                            <span className="text-[9px] text-slate-500 block">{item.low_s}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white">R{Number(item.max_p).toLocaleString()}</span>
                            <span className="text-[9px] text-slate-500 block">{item.high_s}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-orange-500 tabular-nums">{item.v_pct}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table B: Supply Chain Velocity */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-red-500">Table B: Stock Velocity & Implied Sales</h2>
                  <p className="text-[11px] text-slate-400">Power, Networking, and Storage items with highest unit drops in trailing 7 days.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-850">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Units Sold (7d)</th>
                      <th className="py-2.5 px-3 text-right">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-36 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-12 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-12 bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : !data?.sc_velocity || data.sc_velocity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 italic">No inventory drops recorded.</td>
                      </tr>
                    ) : (
                      data.sc_velocity.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{item.sku}</td>
                          <td className="py-2.5 px-3 font-semibold truncate max-w-[150px] sm:max-w-[200px]" title={item.name}>{item.name}</td>
                          <td className="py-2.5 px-3"><span className="px-2 py-0.5 bg-slate-800 rounded-md text-[9px] font-black uppercase text-slate-400">{item.cat}</span></td>
                          <td className="py-2.5 px-3 font-black text-red-500 tabular-nums">-{item.qty_sold} units</td>
                          <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">{item.cur_stk} units</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table C: Resurrection Alerts */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-green-500">Table C: Stock Resurrection Alerts</h2>
                  <p className="text-[11px] text-slate-400">Products transitioning from complete out-of-stock (&ge;14 days) to &gt;15 units.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-850">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3 text-right">Fresh Stock Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-36 bg-slate-800 rounded" /></td>
                          <td className="py-3 px-3"><div className="h-3 w-12 bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : !data?.resurrect || data.resurrect.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500 italic">No resurrections detected within last 48 hours.</td>
                      </tr>
                    ) : (
                      data.resurrect.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{item.sku}</td>
                          <td className="py-2.5 px-3 font-semibold truncate max-w-[200px] sm:max-w-[350px]" title={item.name}>{item.name}</td>
                          <td className="py-2.5 px-3 text-right font-black text-green-500 tabular-nums">+{item.cur_stk} units</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Social Panel (Right 4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 flex flex-col justify-between sticky top-6">
              
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Automated Social Copy Drafts</h2>
                    <p className="text-[10px] text-slate-500">Hermes weekly social media campaign builder</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" title="Hermes Linked" />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Below are context-derived drafts generated directly from our live Postgres anomaly metrics, optimized for LinkedIn B2B posts targeting local procurement managers.
                </p>

                {/* Draft Containers */}
                <div className="space-y-6 pt-2">
                  {drafting || loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2 animate-pulse bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                        <div className="h-3 w-1/3 bg-slate-850 rounded" />
                        <div className="h-16 w-full bg-slate-850 rounded" />
                      </div>
                    ))
                  ) : drafts.map((draft, idx) => (
                    <div key={idx} className="group relative bg-slate-950/80 border border-slate-855 hover:border-slate-800 rounded-2xl p-4.5 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/10">
                          Draft {idx + 1}: {idx === 0 ? 'Price Arbitrage' : idx === 1 ? 'Velocity Surge' : 'Stock Arrival'}
                        </span>
                        
                        <button
                          onClick={() => copyToClipboard(draft, idx)}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${
                            copiedIndex === idx
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {copiedIndex === idx ? '✓ Copied' : 'Copy Text'}
                        </button>
                      </div>
                      
                      <pre className="text-slate-300 text-[10.5px] leading-relaxed whitespace-pre-wrap font-sans font-medium select-text break-words bg-slate-950 p-2.5 border border-slate-900 rounded-xl max-h-48 overflow-y-auto custom-scrollbar font-mono">
                        {draft}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-slate-850 mt-6">
                <button
                  onClick={() => generateSocialDrafts(data || { price_arb: [], sc_velocity: [], resurrect: [], ts: '' })}
                  disabled={drafting || loading || !data}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-orange-500/10 active:scale-95 disabled:opacity-50"
                >
                  {drafting ? 'Generating with Hermes...' : 'Refresh Insights via Hermes'}
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
