'use client';

import { useState, useEffect, useRef } from 'react';

interface SmartFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  maxVisible?: number;
}

export default function SmartFilter({ 
  label, 
  options, 
  selected, 
  onChange, 
  placeholder,
  maxVisible = 8 
}: SmartFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // Limit to 50 for performance

  // Popular options (most common ones first)
  const popularOptions = options.slice(0, maxVisible);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
        {label}
        {selected.length > 0 && (
          <span className="ml-2 text-blue-600">({selected.length})</span>
        )}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 text-left rounded border border-gray-200 text-sm bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {selected.length === 0 
              ? placeholder 
              : selected.length === 1 
                ? selected[0]
                : `${selected.length} selected`
            }
          </span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Clear all button */}
          {selected.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all ({selected.length})
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto">
            {searchTerm === '' && (
              <>
                {/* Popular options when not searching */}
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Popular</div>
                  {popularOptions.map(option => (
                    <label
                      key={option}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(option)}
                        onChange={() => toggleOption(option)}
                        className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 flex-1">{option}</span>
                    </label>
                  ))}
                </div>
                
                {/* Removed: The section showing ALL options when not searching */}
              </>
            )}

            {/* Filtered options when searching */}
            {searchTerm !== '' && (
              <div className="p-2">
                {filteredOptions.length > 0 ? (
                  <>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Results ({filteredOptions.length})
                    </div>
                    {filteredOptions.map(option => (
                      <label
                        key={option}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(option)}
                          onChange={() => toggleOption(option)}
                          className="mr-3 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 flex-1">{option}</span>
                      </label>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No {label.toLowerCase()} found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}