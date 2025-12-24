import React, { useState, useEffect, useRef } from 'react';

interface MegaFilterDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export default function MegaFilterDropdown({ label, options, selected, onChange, placeholder }: MegaFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const selectAll = () => {
        // If search is active, select visible only? Or all? Let's do visible.
        const unique = Array.from(new Set([...selected, ...filteredOptions]));
        onChange(unique);
    };

    const clearAll = () => {
        onChange([]);
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">{label}</label>

            {/* Trigger Button */}
            <div
                className={`w-full p-2 rounded border text-sm cursor-pointer flex justify-between items-center transition-colors ${isOpen ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`flex-1 truncate ${selected.length > 0 ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                    {selected.length > 0 ? `${selected.length} Selected` : (placeholder || `All ${label}s`)}
                </span>
                <span className="text-gray-400 ml-2">
                    <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
            </div>

            {/* Mega Menu Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full md:w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    {/* Header: Search & Quick Actions */}
                    <div className="p-3 bg-gray-50 border-b border-gray-200 flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                className="w-full pl-8 p-1.5 text-sm rounded border border-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder={`Search ${label}...`}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button onClick={selectAll} className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-100 rounded">Select All</button>
                        <button onClick={clearAll} className="text-xs px-2 py-1 text-red-600 hover:bg-red-100 rounded">Clear</button>
                    </div>

                    {/* Chip Cloud of Options */}
                    <div className="p-3 max-h-80 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            <div className="space-y-4">
                                {/* Top Picks (only show if not searching or if items exist) */}
                                {search === '' && filteredOptions.length > 12 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Picks</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredOptions.slice(0, 12).map(opt => (
                                                <div
                                                    key={opt}
                                                    onClick={() => toggleOption(opt)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all active:scale-95 select-none ${selected.includes(opt)
                                                            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* All / Remaining Options */}
                                <div>
                                    {search === '' && filteredOptions.length > 12 && (
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">All {label}s</h4>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {(search !== '' ? filteredOptions : filteredOptions.slice(filteredOptions.length > 12 ? 12 : 0)).map(opt => (
                                            <div
                                                key={opt}
                                                onClick={() => toggleOption(opt)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all active:scale-95 select-none ${selected.includes(opt)
                                                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">No results found for "{search}"</div>
                        )}
                    </div>

                    {/* Footer status */}
                    <div className="bg-gray-50 p-2 text-xs text-center text-gray-400 border-t border-gray-100">
                        {selected.length} items select
                    </div>
                </div>
            )}
        </div>
    );
}
