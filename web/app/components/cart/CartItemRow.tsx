'use client';

import React from 'react';
import { CartItem, UserRole, Project } from '../../types';
import { calculatePrice, formatPrice, PricingSettings } from '../../../lib/pricing';

interface CartItemRowProps {
  item: CartItem;
  projects: Project[];
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  updateItemProject: (itemId: number, projectId?: string) => void;
  userRole: UserRole;
  pricingSettings: PricingSettings;
}

export default function CartItemRow({
  item,
  projects,
  updateQuantity,
  removeItem,
  updateItemProject,
  userRole,
  pricingSettings
}: CartItemRowProps) {
  const itemPrice = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
  const lineTotal = parseFloat(itemPrice.exVat) * item.quantity;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-2 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
              {item.brand}
            </span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 font-bold text-gray-500 uppercase tracking-widest">
              {item.supplier_name}
            </span>
          </div>
          <h4 className="text-[11px] font-black text-gray-900 dark:text-white mt-1 leading-tight group-hover:text-orange-500 transition-colors">
            {item.name}
          </h4>
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
            SKU: {item.supplier_sku}
          </p>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
          title="Remove from Quote"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-center gap-4 pt-1 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => updateQuantity(item.id, -1)}
            disabled={item.quantity <= 1}
            className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white disabled:opacity-30"
          >
            -
          </button>
          <span className="w-6 text-center text-[10px] font-black text-gray-900 dark:text-white tabular-nums">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, 1)}
            className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            +
          </button>
        </div>
        <div className="text-right flex flex-col items-end">
          {userRole === 'public' ? (
            <span className="text-[11px] font-black text-orange-500 uppercase tracking-tighter">
              Price Hidden
            </span>
          ) : (
            <>
              <span className="text-[11px] font-black text-gray-900 dark:text-white tabular-nums">
                R {formatPrice(lineTotal)}
              </span>
              <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500">
                R {formatPrice(parseFloat(itemPrice.exVat))} ea
              </span>
            </>
          )}
        </div>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-50 dark:border-gray-800 mt-0.5">
          <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">
            Site Assignment:
          </span>
          <select
            value={item.projectId || ''}
            onChange={(e) => updateItemProject(item.id, e.target.value || undefined)}
            className="flex-1 text-[9px] font-bold bg-gray-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="">Main Quote</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
