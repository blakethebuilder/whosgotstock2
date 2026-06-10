'use client';

import React, { memo } from 'react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  userRole: string;
  onSelectProduct: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  compareList: Product[];
  displayPrice: (product: Product) => { exVat: string; incVat: string; isPOR: boolean };
  searchQuery?: string;
}

const Highlight = memo(({ text, query }: { text: string, query: string }) => {
  if (!query || query.length < 2) return <>{text}</>;
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <span key={i} className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-sm px-0.5">{part}</span>
          : part
      )}
    </>
  );
});

interface ProductRowProps {
  product: Product;
  userRole: string;
  onSelect: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCompare: boolean;
  priceDisplay: { exVat: string; incVat: string; isPOR: boolean };
  searchQuery: string;
}

const ProductRow = memo(({
  product,
  userRole,
  onSelect,
  onToggleCompare,
  onAddToCart,
  isInCompare,
  priceDisplay,
  searchQuery
}: ProductRowProps) => {
  return (
    <tr
      onClick={() => onSelect(product)}
      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
    >
      <td className="px-3 sm:px-6 py-4 max-w-[240px] sm:max-w-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 sm:p-2 border border-gray-100 dark:border-gray-800">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt=""
                loading="lazy"
                className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
              />
            ) : (
              <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 sm:line-clamp-1 group-hover:text-orange-500 transition-colors">
              <Highlight text={product.name} query={searchQuery} />
            </span>
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              <span className="md:hidden text-[8px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1 py-0.2 rounded uppercase">
                {product.brand}
              </span>
              <span className="lg:hidden text-[8px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-gray-800 px-1 py-0.2 rounded">
                {(userRole === 'public' || userRole === 'team') ? 'Smart' : product.supplier_name}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell px-4 sm:px-6 py-4">
        <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg uppercase">
          {product.brand}
        </span>
      </td>
      <td className="hidden lg:table-cell px-4 sm:px-6 py-4">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
          {(userRole === 'public' || userRole === 'team') ? 'Smart Integrate' : product.supplier_name}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tighter ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'} w-max`}>
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${product.qty_on_hand > 0 ? 'bg-[#4A5D16]' : 'bg-red-500'}`} />
            {product.qty_on_hand > 0 ? `${product.qty_on_hand} Qty` : 'Out'}
          </div>
          {((product.stock_jhb || 0) > 0 || (product.stock_cpt || 0) > 0) && (
            <div className="hidden sm:flex gap-2 ml-1">
              {(product.stock_jhb || 0) > 0 && <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">JHB: {product.stock_jhb}</span>}
              {(product.stock_cpt || 0) > 0 && <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">CPT: {product.stock_cpt}</span>}
            </div>
          )}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-4 text-right">
        <div className="flex flex-col items-end">
          {userRole === 'public' ? (
            <span className="font-black text-orange-500 text-xs">Hidden</span>
          ) : priceDisplay.isPOR ? (
            <span className="font-black text-gray-900 dark:text-white text-[11px] sm:text-sm">POR</span>
          ) : (
            <>
              <span className="font-black text-gray-900 dark:text-white text-xs sm:text-sm">
                R {priceDisplay.exVat}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-orange-500 mt-0.5">
                R {priceDisplay.incVat} <span className="text-[7px] sm:text-[8px] text-gray-400 font-medium">Inc.</span>
              </span>
            </>
          )}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
            className={`p-1.5 sm:p-2 rounded-xl transition-all ${isInCompare ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20'}`}
            title="Compare Product"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl active:scale-95 transition-all hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white"
          >
            <span className="hidden sm:inline">+ Quote</span>
            <span className="sm:hidden text-xs font-bold">+</span>
          </button>
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  return (
    prev.product.id === next.product.id &&
    prev.product.qty_on_hand === next.product.qty_on_hand &&
    prev.product.stock_jhb === next.product.stock_jhb &&
    prev.product.stock_cpt === next.product.stock_cpt &&
    prev.userRole === next.userRole &&
    prev.isInCompare === next.isInCompare &&
    prev.searchQuery === next.searchQuery &&
    prev.priceDisplay.exVat === next.priceDisplay.exVat &&
    prev.priceDisplay.incVat === next.priceDisplay.incVat &&
    prev.priceDisplay.isPOR === next.priceDisplay.isPOR
  );
});

export default function ProductTable({
  products,
  userRole,
  onSelectProduct,
  onToggleCompare,
  onAddToCart,
  compareList,
  displayPrice,
  searchQuery = ''
}: ProductTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[2.5rem] border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[340px]">
          <thead>
            <tr className="border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <th className="px-3 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Details</th>
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Brand</th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-4 sm:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supplier</th>
              <th className="px-3 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th>
              <th className="px-3 sm:px-6 py-4 sm:py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Price (Ex)</th>
              <th className="px-3 sm:px-6 py-4 sm:py-5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {products.map((product) => {
              const isInCompare = compareList.some((p) => p.id === product.id);
              const priceDisplay = displayPrice(product);
              return (
                <ProductRow
                  key={product.id}
                  product={product}
                  userRole={userRole}
                  onSelect={onSelectProduct}
                  onToggleCompare={onToggleCompare}
                  onAddToCart={onAddToCart}
                  isInCompare={isInCompare}
                  priceDisplay={priceDisplay}
                  searchQuery={searchQuery}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
