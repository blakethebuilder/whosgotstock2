'use client';

import { useState, useEffect } from 'react';

interface CategoryTilesProps {
  onCategoryClick: (category: string) => void;
}

const popularCategories = [
  { name: 'Laptops', icon: '💻', searchTerms: ['laptop', 'notebook'] },
  { name: 'Graphics Cards', icon: '🎮', searchTerms: ['graphics card', 'gpu', 'video card'] },
  { name: 'Storage', icon: '💾', searchTerms: ['ssd', 'hard drive', 'storage'] },
  { name: 'Networking', icon: '🌐', searchTerms: ['router', 'switch', 'access point'] },
  { name: 'Monitors', icon: '🖥️', searchTerms: ['monitor', 'display', 'screen'] },
  { name: 'Memory', icon: '🧠', searchTerms: ['ram', 'memory', 'ddr4', 'ddr5'] },
  { name: 'Processors', icon: '⚡', searchTerms: ['cpu', 'processor', 'intel', 'amd'] },
  { name: 'Servers', icon: '🏢', searchTerms: ['server', 'rack', 'enterprise'] },
  { name: 'Printers', icon: '🖨️', searchTerms: ['printer', 'print', 'scanner'] },
  { name: 'Cables', icon: '🔌', searchTerms: ['cable', 'connector', 'adapter'] },
  { name: 'Security', icon: '🔒', searchTerms: ['camera', 'security', 'surveillance'] },
  { name: 'Power', icon: '🔋', searchTerms: ['ups', 'power', 'battery'] }
];

export default function CategoryTiles({ onCategoryClick }: CategoryTilesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleCategoryClick = (category: typeof popularCategories[0]) => {
    // Use the first search term for the search
    onCategoryClick(category.searchTerms[0]);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          Popular Categories
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
          What are you looking for?
        </h3>
        <p className="text-gray-500 text-sm">
          Click a category to search thousands of products instantly
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {popularCategories.map((category, index) => (
          <div
            key={category.name}
            onClick={() => handleCategoryClick(category)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all cursor-pointer p-6 text-center min-h-[120px] flex flex-col items-center justify-center relative overflow-hidden"
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
              <div className="text-3xl transform group-hover:scale-110 transition-transform">
                {category.icon}
              </div>
              
              <div className="space-y-1">
                <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors block leading-tight">
                  {category.name}
                </span>
                
                {hoveredIndex === index && (
                  <div className="text-xs text-gray-500 animate-in fade-in duration-200">
                    Click to search
                  </div>
                )}
              </div>
            </div>

            {/* Hover effect border */}
            <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Quick search suggestions */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 mb-3">Or try searching for:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['HP EliteBook', 'Cisco Router', 'Samsung SSD', 'Dell Monitor', 'MikroTik Switch'].map(term => (
            <button
              key={term}
              onClick={() => onCategoryClick(term)}
              className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-xs text-gray-600 hover:text-blue-600 rounded-full transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}