'use client';

import React from 'react';
import { formatPrice } from '../../../lib/pricing';

interface SupplierBreakdown {
  name: string;
  total: number;
}

interface CartCostSummaryProps {
  supplierBreakdowns: SupplierBreakdown[];
  totalExVat: number;
  totalIncVat: number;
  generateEmailTemplate: () => void;
}

export default function CartCostSummary({
  supplierBreakdowns,
  totalExVat,
  totalIncVat,
  generateEmailTemplate
}: CartCostSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-850 px-5 py-4 shrink-0 space-y-4">
      {/* Supplier cost breakdown */}
      {supplierBreakdowns.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">
            Distributor Subtotals (Ex VAT)
          </span>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-gray-600 dark:text-gray-300">
            {supplierBreakdowns.map(sb => (
              <div key={sb.name} className="flex justify-between border-b border-gray-100/50 dark:border-gray-800/30 pb-0.5">
                <span className="truncate pr-1">{sb.name}</span>
                <span className="text-gray-900 dark:text-white tabular-nums">
                  R {formatPrice(sb.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">Subtotal (Ex VAT)</span>
          <span className="font-bold text-gray-700 dark:text-gray-350 tabular-nums">
            R {formatPrice(totalExVat)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
              Total (Inc VAT)
            </span>
          </div>
          <span className="text-xl font-black text-orange-600 dark:text-orange-500 tabular-nums">
            R {formatPrice(totalIncVat)}
          </span>
        </div>
      </div>

      <button
        onClick={generateEmailTemplate}
        className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Generate Packages
      </button>
    </div>
  );
}
