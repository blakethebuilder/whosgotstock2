'use client';

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

const Highlight = ({ text, query }: { text: string, query: string }) => {
  if (!query || query.length < 2) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
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
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 dark:border-gray-800">
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Brand</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supplier</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Price (Ex)</th>
              <th className="px-6 py-5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {products.map((product) => (
              <tr
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center p-2">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
                      <Highlight text={product.name} query={searchQuery} />
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg uppercase">
                    {product.brand}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                    {(userRole === 'public' || userRole === 'team') ? 'Smart Integrate' : product.supplier_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${product.qty_on_hand > 0 ? 'bg-[#D8E698] text-[#4A5D16]' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${product.qty_on_hand > 0 ? 'bg-[#4A5D16]' : 'bg-red-500'}`} />
                      {product.qty_on_hand > 0 ? `${product.qty_on_hand} Total` : 'Out'}
                    </div>
                    {((product.stock_jhb || 0) > 0 || (product.stock_cpt || 0) > 0) && (
                      <div className="flex gap-2 ml-1">
                        {(product.stock_jhb || 0) > 0 && <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">JHB: {product.stock_jhb}</span>}
                        {(product.stock_cpt || 0) > 0 && <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">CPT: {product.stock_cpt}</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    {displayPrice(product).isPOR ? (
                      <span className="font-black text-gray-900 dark:text-white text-sm">POR</span>
                    ) : (
                      <>
                        <span className="font-black text-gray-900 dark:text-white text-sm">
                          R {displayPrice(product).exVat}
                        </span>
                        <span className="text-[10px] font-bold text-orange-500">
                          R {displayPrice(product).incVat} <span className="text-[8px] text-gray-400 font-medium">Inc.</span>
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCompare(product); }}
                      className={`p-2 rounded-xl transition-all ${compareList.find((p) => p.id === product.id) ? 'bg-orange-500 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-orange-500'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                      className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active:scale-95 transition-all"
                    >
                      + Quote
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
