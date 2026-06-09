'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex justify-between items-center">
        <Link href="/" className="flex items-center group">
          <div className="bg-white/10 hover:bg-white/20 px-4 h-10 rounded-2xl flex items-center justify-center transition-all border border-white/10 active:scale-95">
            <span className="text-white font-black text-xs tracking-tighter uppercase">
              ← Back to Search
            </span>
          </div>
        </Link>
        <span className="text-xs font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          Public Tier Upgrade
        </span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center py-12">
        <div className="text-center space-y-4 max-w-2xl mb-12">
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tighter">
            Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Direct Sourcing</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-semibold leading-relaxed">
            Stop paying public markup rates. Access the wholesale IT hardware channel with fully transparent, unmodified distributor pricing.
          </p>
        </div>

        {/* Pricing Card */}
        <div 
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:scale-[1.02] hover:border-orange-500/30 group"
          style={{ boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                Premium Reseller Plan
              </span>
              <h2 className="text-3xl font-black text-white tracking-tighter italic pt-2">Direct Channel Tier</h2>
              <p className="text-gray-400 text-xs font-semibold">
                Designed for IT resellers, MSPs, and system builders.
              </p>
            </div>

            {/* Price display */}
            <div className="py-6 border-y border-white/10 flex flex-col items-center justify-center sm:items-start">
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-5xl sm:text-6xl font-black tracking-tighter">R699</span>
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">/ month</span>
              </div>
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                No markup on suppliers (0% Margin applied)
              </p>
            </div>

            {/* ICT Restricted access warning */}
            <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2">
              🔒 Only registered ICT companies can see unmasked dealer costs.
            </div>

            {/* Features */}
            <div className="space-y-4 py-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-300">What's included:</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                {[
                  '100% Unmasked supplier names (Linkqage, Pinnacle, Rectron, Scoop, Esquire, etc.)',
                  'Direct B2B pricing feeds (unmodified, zero added margins)',
                  'Unlimited live concurrent search pings',
                  'Multi-supplier quote packaging & CSV exporting',
                  'Integration with custom reseller markup profiles',
                  'Access to premium networking, cabling, and power components'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-4 text-center space-y-3">
              <Link
                href="/login"
                className="block w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl transition-all hover:scale-102 active:scale-98 shadow-xl shadow-orange-500/20"
              >
                Log In to Activate Direct Access
              </Link>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3.5 text-[10px] text-orange-400 font-bold leading-relaxed text-left">
                ⚠️ IMPORTANT: Only registered ICT companies can see unmasked dealer costs. To setup or register a new reseller organization, please contact your account manager or email <span className="underline text-white">info@whosgotstock.co.za</span>.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        &copy; {new Date().getFullYear()} WhosGotStock. All Rights Reserved.
      </footer>
    </div>
  );
}
