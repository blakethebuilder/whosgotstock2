'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  auth: 'api-key' | 'session' | 'bearer' | 'none';
  summary: string;
  description: string;
  requestBody?: Record<string, { type: string; required: boolean; description: string }>;
  responseExample: string;
  queryParams?: Record<string, { type: string; required: boolean; description: string }>;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-400 border-green-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  PATCH: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const AUTH_BADGES: Record<string, { label: string; color: string }> = {
  'api-key': { label: 'API Key', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'session': { label: 'Session Cookie', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'bearer': { label: 'Bearer Token', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'none': { label: 'Public', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

const ENDPOINTS: { section: string; description: string; routes: Endpoint[] }[] = [
  {
    section: 'Search & Products',
    description: 'Core product search across all distributor feeds. Supports API key or active session.',
    routes: [
      {
        method: 'GET',
        path: '/api/search',
        auth: 'api-key',
        summary: 'Search products across all distributor feeds',
        description: 'Returns paginated product results with live stock and pricing from all integrated suppliers. Supports full-text search, supplier filtering, category, brand, price range, and stock-only filtering.',
        queryParams: {
          q: { type: 'string', required: false, description: 'Search query (product name, SKU, brand)' },
          suppliers: { type: 'string', required: false, description: 'Comma-separated supplier slugs to filter by' },
          categories: { type: 'string', required: false, description: 'Comma-separated category names' },
          brand: { type: 'string', required: false, description: 'Brand name filter' },
          min_price: { type: 'number', required: false, description: 'Minimum dealer price (ex VAT)' },
          max_price: { type: 'number', required: false, description: 'Maximum dealer price (ex VAT)' },
          in_stock: { type: 'boolean', required: false, description: 'Set true to return only in-stock items' },
          sort: { type: 'string', required: false, description: 'Sort order: relevance | price_asc | price_desc | name_asc' },
          page: { type: 'number', required: false, description: 'Page number (default: 1, 50 results per page)' },
        },
        responseExample: `{
  "results": [
    {
      "id": 1234,
      "supplier_name": "Linkqage",
      "supplier_sku": "USW-24-POE",
      "master_sku": "USW-24-POE",
      "name": "UniFi 24-Port PoE Switch",
      "brand": "Ubiquiti",
      "category": "Networking",
      "price_ex_vat": "7200.00",
      "qty_on_hand": 15,
      "stock_jhb": 10,
      "stock_cpt": 5
    }
  ],
  "total": 847,
  "page": 1
}`,
      },
    ],
  },
  {
    section: 'Channel Intelligence',
    description: 'Market anomaly analytics for B2B procurement intelligence. Requires Hermes Bearer token.',
    routes: [
      {
        method: 'GET',
        path: '/api/v1/marketing-snapshot',
        auth: 'bearer',
        summary: 'Live market anomaly snapshot (Hermes analytics feed)',
        description: 'Returns three market anomaly datasets derived from live distributor data and historical channel snapshots. Used by the Hermes agent to generate weekly B2B social content. Requires Authorization: Bearer <HERMES_API_TOKEN> header.',
        responseExample: `{
  "price_arb": [
    {
      "sku": "SYN-INV-5K",
      "name": "Sunsynk 5kW Hybrid Inverter",
      "min_p": "18500.00",
      "max_p": "24900.00",
      "v_pct": "34.59",
      "low_s": "Rectron",
      "high_s": "Mustek"
    }
  ],
  "sc_velocity": [
    {
      "sku": "SYN-INV-5K",
      "name": "Sunsynk 5kW Hybrid Inverter",
      "cat": "Power Solutions",
      "qty_sold": "138",
      "cur_stk": "12"
    }
  ],
  "resurrect": [
    {
      "sku": "AMD-5700X",
      "name": "AMD Ryzen 7 5700X CPU",
      "cur_stk": "50"
    }
  ],
  "ts": "2026-06-09T20:00:00.000Z"
}`,
      },
    ],
  },
  {
    section: 'Suppliers',
    description: 'Retrieve available supplier information.',
    routes: [
      {
        method: 'GET',
        path: '/api/suppliers',
        auth: 'none',
        summary: 'List all active distributor suppliers',
        description: 'Returns the list of all registered and enabled suppliers, their slugs and feed types.',
        responseExample: `[
  { "id": 1, "name": "Linkqage", "slug": "linkqage", "type": "json", "enabled": true },
  { "id": 2, "name": "Miro",     "slug": "miro",     "type": "xml",  "enabled": true }
]`,
      },
      {
        method: 'GET',
        path: '/api/categories',
        auth: 'none',
        summary: 'List all product categories',
        description: 'Returns distinct product categories currently present in the product catalogue.',
        responseExample: `["Networking", "Power Solutions", "Storage", "Processors", "Displays"]`,
      },
    ],
  },
];

function EndpointCard({ route }: { route: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyExample = () => {
    navigator.clipboard.writeText(route.responseExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-800/60 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors text-left"
      >
        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${METHOD_COLORS[route.method]}`}>
          {route.method}
        </span>
        <code className="text-sm font-mono text-white font-bold flex-1">{route.path}</code>
        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${AUTH_BADGES[route.auth].color}`}>
          {AUTH_BADGES[route.auth].label}
        </span>
        <span className="text-slate-400 text-xs font-medium hidden sm:block max-w-xs truncate">{route.summary}</span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-800/60 bg-slate-950/40 p-5 space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">{route.description}</p>

          {route.queryParams && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Query Parameters</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Parameter</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Required</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(route.queryParams).map(([key, val]) => (
                      <tr key={key} className="hover:bg-slate-900/30">
                        <td className="py-2 px-3 font-mono text-orange-400">{key}</td>
                        <td className="py-2 px-3 text-slate-400">{val.type}</td>
                        <td className="py-2 px-3">
                          {val.required
                            ? <span className="text-red-400 font-bold">required</span>
                            : <span className="text-slate-600">optional</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{val.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {route.requestBody && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Request Body (JSON)</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Required</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.entries(route.requestBody).map(([key, val]) => (
                      <tr key={key} className="hover:bg-slate-900/30">
                        <td className="py-2 px-3 font-mono text-orange-400">{key}</td>
                        <td className="py-2 px-3 text-slate-400">{val.type}</td>
                        <td className="py-2 px-3">
                          {val.required
                            ? <span className="text-red-400 font-bold">required</span>
                            : <span className="text-slate-600">optional</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-400">{val.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Example Response</h4>
              <button
                onClick={copyExample}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${copied ? 'bg-green-600 border-green-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {route.responseExample}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">
              ← WhosGotStock
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">API Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400">v1 · Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12 space-y-12">

        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">WhosGotStock API</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            API Reference
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Programmatic access to South Africa's unified ICT distributor feed. Search 16,000+ products across Miro, Linkqage, Rectron, Pinnacle, Syntech, Mustek, Scoop and more — all with live stock and dealer pricing.
          </p>
        </div>

        {/* Authentication */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Authentication</h2>
          <p className="text-sm text-slate-400">
            The <code className="text-orange-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">/api/search</code> endpoint accepts either method:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">API Key (Recommended)</div>
              <p className="text-xs text-slate-400">Pass your key in the Authorization header. Keys are generated per-user by an admin via the Reseller Access panel.</p>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 rounded-lg p-3 overflow-x-auto">
{`Authorization: Bearer wgs_live_xxxxxxxxxxxx`}
              </pre>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">Session Cookie</div>
              <p className="text-xs text-slate-400">For browser-based access after logging in. The <code className="text-orange-400">auth-token</code> cookie is set automatically on login.</p>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 rounded-lg p-3 overflow-x-auto">
{`Cookie: auth-token=<jwt>`}
              </pre>
            </div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400 font-medium">
            ⚠️ API keys give the same access level as the user's assigned role. Admin-level users get raw dealer costs; public-role users see marked-up prices. Request a <strong>reseller</strong> role key for unmasked pricing.
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl px-5 py-4 flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base URL</span>
          <code className="text-orange-400 font-mono text-sm">https://whosgotstock.co.za</code>
        </div>

        {/* Endpoint Sections */}
        {ENDPOINTS.map(section => (
          <div key={section.section} className="space-y-3">
            <div className="space-y-1 pb-3 border-b border-slate-800">
              <h2 className="text-lg font-black text-white tracking-tight">{section.section}</h2>
              <p className="text-xs text-slate-400">{section.description}</p>
            </div>
            <div className="space-y-2">
              {section.routes.map(route => (
                <EndpointCard key={`${route.method}-${route.path}`} route={route} />
              ))}
            </div>
          </div>
        ))}

        {/* Rate Limits */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 space-y-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Rate Limits & Access Tiers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2 pr-6">Role</th>
                  <th className="pb-2 pr-6">Searches / Month</th>
                  <th className="pb-2 pr-6">Pricing Shown</th>
                  <th className="pb-2">API Key Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                <tr><td className="py-2.5 pr-6 font-bold text-slate-400">Public</td><td className="pr-6">25</td><td className="pr-6">Retail (marked up)</td><td>No</td></tr>
                <tr><td className="py-2.5 pr-6 font-bold text-blue-400">Team</td><td className="pr-6">Unlimited</td><td className="pr-6">Staff discount</td><td>On request</td></tr>
                <tr><td className="py-2.5 pr-6 font-bold text-orange-400">Reseller</td><td className="pr-6">Unlimited</td><td className="pr-6">Dealer cost (unmasked)</td><td>Yes</td></tr>
                <tr><td className="py-2.5 pr-6 font-bold text-green-400">Admin</td><td className="pr-6">Unlimited</td><td className="pr-6">Raw dealer cost</td><td>Yes</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-600 text-center pb-4">
          WhosGotStock API v1 · South African ICT Distribution Intelligence · Contact admin to request API access
        </p>
      </div>
    </div>
  );
}
