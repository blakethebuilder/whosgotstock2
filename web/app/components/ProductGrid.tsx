'use client';

import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  userRole: string;
  onSelectProduct: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  compareList: Product[];
  displayPrice: (product: Product) => { exVat: string; incVat: string; isPOR: boolean };
  searchQuery?: string;
}

const Highlight = ({ text, query }: { text: string, query: string }) => {
  if (!query || query.length < 2) return <>{text}</>;
  
  // Escape special regex characters in the query
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
};

export default function ProductGrid({
  products,
  userRole,
  onSelectProduct,
  onToggleCompare,
  onAddToCart,
  compareList,
  displayPrice,
  searchQuery = ''
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onSelectProduct(product)}
          className="group bg-white dark:bg-gray-900 rounded-2xl p-3 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer relative flex flex-col justify-between"
        >
          <div>
            <div className="aspect-square bg-[#F8F9FA] dark:bg-gray-800 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative p-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
              <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight border border-white/50 text-orange-600">
                {product.brand}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur shadow-sm transition-all border ${compareList.find((p) => p.id === product.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/80 dark:bg-gray-700/80 text-gray-400 border-white hover:text-orange-500'}`}
                title="Compare Product"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="px-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-xs line-clamp-2 leading-snug mb-1.5 group-hover:text-orange-500 transition-colors h-8">
                <Highlight text={product.name} query={searchQuery} />
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-md">
                  {(userRole === 'public' || userRole === 'team') ? 'Smart Integrate' : product.supplier_name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="px-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between gap-2">
            <div className="space-y-0.5">
              {displayPrice(product).isPOR ? (
                <div className="text-xs font-black text-gray-900 dark:text-white leading-none">
                  Price on Request
                </div>
              ) : (
                <>
                  <div className="text-base font-black text-gray-900 dark:text-white leading-none">
                    R {displayPrice(product).exVat}
                  </div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                    Excl. VAT
                  </div>
                  <div className="text-[11px] font-bold text-orange-500 leading-none mt-1">
                    R {displayPrice(product).incVat}
                  </div>
                  <div className="text-[7px] font-bold text-gray-400/60 uppercase tracking-tight">
                    Incl. VAT
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                {product.qty_on_hand > 0 ? `${product.qty_on_hand} Stock` : 'Out of Stock'}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-md shadow-gray-100 dark:shadow-none"
              >
                + Quote
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
