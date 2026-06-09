'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="md:col-span-12 mt-16 pt-12 border-t border-gray-200 dark:border-gray-800 text-center sm:text-left">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
        <div className="space-y-4">
          <span className="text-gray-900 dark:text-white font-black text-sm tracking-tighter uppercase">
            WHOSGOT<span className="text-orange-500 ml-0.5">STOCK</span>
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-relaxed max-w-xs">
            South Africa's premier unified IT hardware sourcing aggregator. Instant pricing, inventory matching, and multi-supplier quote packaging.
          </p>
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
            Public visitors can browse general hardware listings. Live stock warehouse levels, custom pricing markups, and purchase builder options require a verified reseller channel login.
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
  );
}
