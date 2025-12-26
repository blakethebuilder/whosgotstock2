'use client';

import { useState } from 'react';

interface CategoryTilesProps {
  onCategoryClick: (category: string) => void;
}

const popularCategories = [
  { 
    name: 'Laptops', 
    searchTerms: ['laptop', 'notebook'],
    icon: '💻'
  },
  { 
    name: 'Graphics Cards', 
    searchTerms: ['graphics card', 'gpu', 'video card'],
    icon: '🎮'
  },
  { 
    name: 'Storage', 
    searchTerms: ['ssd', 'hard drive', 'storage'],
    icon: '💾'
  },
  { 
    name: 'Networking', 
    searchTerms: ['router', 'switch', 'access point'],
    icon: '🌐'
  },
  { 
    name: 'Monitors', 
    searchTerms: ['monitor', 'display', 'screen'],
    icon: '🖥️'
  },
  { 
    name: 'Memory', 
    searchTerms: ['ram', 'memory', 'ddr4', 'ddr5'],
    icon: '🧠'
  },
  { 
    name: 'Processors', 
    searchTerms: ['cpu', 'processor', 'intel', 'amd'],
    icon: '⚡'
  },
  { 
    name: 'Servers', 
    searchTerms: ['server', 'rack', 'enterprise'],
    icon: '🏢'
  },
  { 
    name: 'Printers', 
    searchTerms: ['printer', 'print', 'scanner'],
    icon: '🖨️'
  },
  { 
    name: 'Cables', 
    searchTerms: ['cable', 'connector', 'adapter'],
    icon: '🔌'
  },
  { 
    name: 'Security', 
    searchTerms: ['camera', 'security', 'surveillance'],
    icon: '🔒'
  },
  { 
    name: 'Components', 
    searchTerms: ['component', 'part', 'accessory'],
    icon: '🔧'
  }
];

export default function CategoryTiles({ onCategoryClick }: CategoryTilesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleCategoryClick = (category: typeof popularCategories[0]) => {
    // Use the first search term for the search
    onCategoryClick(category.searchTerms[0]);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {popularCategories.map((category, index) => (
        <div
          key={category.name}
          onClick={() => handleCategoryClick(category)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all cursor-pointer p-4 text-center min-h-[100px] flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
            <div className="text-2xl group-hover:scale-110 transition-transform">
              {category.icon}
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors block leading-tight">
                {category.name}
              </span>
              
              {hoveredIndex === index && (
                <div className="text-[10px] text-gray-500 animate-in fade-in duration-200">
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
  );
}