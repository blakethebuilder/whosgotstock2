'use client';

import { useState } from 'react';

interface CategoryTilesProps {
  onCategoryClick: (category: string) => void;
}

const popularCategories = [
  { 
    name: 'Laptops', 
    searchTerms: ['laptop', 'notebook'],
    color: 'bg-blue-500/10 text-blue-600',
    icon: '💻'
  },
  { 
    name: 'Graphics', 
    searchTerms: ['graphics card', 'gpu', 'video card'],
    color: 'bg-purple-500/10 text-purple-600',
    icon: '🎮'
  },
  { 
    name: 'Storage', 
    searchTerms: ['ssd', 'hard drive', 'storage'],
    color: 'bg-emerald-500/10 text-emerald-600',
    icon: '💾'
  },
  { 
    name: 'Networking', 
    searchTerms: ['router', 'switch', 'access point'],
    color: 'bg-[#D8E698] text-[#4A5D16]',
    icon: '🌐'
  },
  { 
    name: 'Displays', 
    searchTerms: ['monitor', 'display', 'screen'],
    color: 'bg-amber-500/10 text-amber-600',
    icon: '🖥️'
  },
  { 
    name: 'Processors', 
    searchTerms: ['cpu', 'processor', 'intel', 'amd'],
    color: 'bg-red-500/10 text-red-600',
    icon: '⚡'
  },
  { 
    name: 'Security', 
    searchTerms: ['camera', 'security', 'surveillance'],
    color: 'bg-indigo-500/10 text-indigo-600',
    icon: '🔒'
  },
  { 
    name: 'Cables', 
    searchTerms: ['cable', 'connector', 'adapter'],
    color: 'bg-orange-500/10 text-orange-600',
    icon: '🔌'
  }
];

export default function CategoryTiles({ onCategoryClick }: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
      {popularCategories.map((category) => (
        <button
          key={category.name}
          onClick={() => onCategoryClick(category.searchTerms[0])}
          className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-white dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center justify-center gap-4 active:scale-95 text-center overflow-hidden relative"
        >
          <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-500`}>
             {category.icon}
          </div>
          
          <div>
            <span className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px] block">
              {category.name}
            </span>
          </div>

          {/* Minimal visual flare like inspiration image */}
          <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3 text-gray-400 rotate-[-45deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </button>
      ))}
    </div>
  );
}