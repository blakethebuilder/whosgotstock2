import React, { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder, label }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        // Reset search when value changes externally or dropdown closes
        if (!isOpen) {
            // Optional: set search to match value? 
            // Generally better to leave search empty so user can type afresh
            setSearch('');
        }
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">{label}</label>

            {/* Trigger / Input */}
            <div
                className="w-full p-2 rounded border border-gray-200 text-sm bg-white cursor-text flex justify-between items-center focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(true)}
            >
                <span className={`flex-1 truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                    {value || placeholder || "Select..."}
                </span>
                <span className="text-gray-400 ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    {/* Sticky Search Input */}
                    <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                        <input
                            autoFocus
                            type="text"
                            className="w-full p-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                            placeholder="Type to search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="py-1">
                        <div
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${value === '' ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}`}
                            onClick={() => handleSelect('')}
                        >
                            All {label}s
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt}
                                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${value === opt ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-400">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
