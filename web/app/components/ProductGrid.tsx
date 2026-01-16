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
}

export default function ProductGrid({
  products,
  userRole,
  onSelectProduct,
  onToggleCompare,
  onAddToCart,
  compareList,
  displayPrice
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onSelectProduct(product)}
          className="group bg-white dark:bg-gray-900 rounded-[2.5rem] p-4 border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-all duration-500 cursor-pointer relative"
        >
          <div className="aspect-square bg-[#F8F9FA] dark:bg-gray-800 rounded-[2rem] mb-4 flex items-center justify-center overflow-hidden relative p-8">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )}
            <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter border border-white/50 text-orange-600">
              {product.brand}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
              className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur shadow-sm transition-all border ${compareList.find((p) => p.id === product.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/80 dark:bg-gray-700/80 text-gray-400 border-white hover:text-orange-500'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
            </button>
          </div>
          <div className="px-2 pb-2">
            <h4 className="font-black text-gray-900 dark:text-white text-base line-clamp-2 leading-tight mb-2 group-hover:text-orange-500 transition-colors">
              {product.name}
            </h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                {(userRole === 'public' || userRole === 'team') ? 'Smart Integrate' : product.supplier_name}
              </span>
            </div>
            <div className="flex items-end justify-between gap-4 mt-6">
              <div className="space-y-1">
                {displayPrice(product).isPOR ? (
                  <div className="text-xl font-black text-gray-900 dark:text-white leading-none">
                    Price on Request
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                      R {displayPrice(product).exVat}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      Excl. VAT
                    </div>
                    <div className="text-sm font-bold text-orange-500 leading-none mt-1">
                      R {displayPrice(product).incVat}
                    </div>
                    <div className="text-[9px] font-bold text-gray-400/60 uppercase tracking-tighter">
                      Incl. VAT
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                  {product.qty_on_hand > 0 ? `${product.qty_on_hand} Stock` : 'Out of Stock'}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                >
                  + Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
