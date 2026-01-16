'use client';

import React from 'react';
import CategoryTiles from './CategoryTiles';

interface EmptySearchResultsProps {
    onCategoryClick: (searchTerm: string) => void;
}

const EmptySearchResults: React.FC<EmptySearchResultsProps> = ({ onCategoryClick }) => {
    return (
        <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-[3rem] border border-dashed border-gray-300 dark:border-gray-700 animate-in fade-in zoom-in duration-500">
            <div className="text-6xl mb-6">🔍</div>
            <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">No matches found</h4>
            <p className="text-gray-400 mt-2 mb-10 max-w-sm mx-auto font-medium">We couldn't find exactly what you're looking for. Try a broader search or explore our top categories.</p>

            <div className="max-w-4xl mx-auto px-6">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="h-[1px] bg-gray-100 dark:bg-gray-800 flex-1" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Try these instead</span>
                    <div className="h-[1px] bg-gray-100 dark:bg-gray-800 flex-1" />
                </div>
                <CategoryTiles
                    onCategoryClick={onCategoryClick}
                />
            </div>
        </div>
    );
};

export default EmptySearchResults;
