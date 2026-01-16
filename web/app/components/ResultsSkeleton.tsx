'use client';

import React from 'react';

const ResultsSkeleton = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-4 border border-white dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] mb-4" />
                    <div className="h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full w-3/4 mb-4" />
                    <div className="h-3 bg-gray-50 dark:bg-gray-800/50 rounded-full w-1/2 mb-8" />
                    <div className="flex justify-between items-end">
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-50 dark:bg-gray-800/50 rounded-full w-24" />
                            <div className="h-2 bg-gray-50 dark:bg-gray-800/50 rounded-full w-12" />
                        </div>
                        <div className="h-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResultsSkeleton;
