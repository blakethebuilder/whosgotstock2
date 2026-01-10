'use client';

import { useState, useEffect, useMemo } from 'react';

interface Category {
  name: string;
  count?: number;
  bySupplier?: Record<string, number>;
}

interface CategoryBrowserProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCategoryClick?: (category: string) => void;
}

const IT_CATEGORIES_HIERARCHY = {
  'Computers & Workstations': {
    'Laptops': ['laptop', 'notebook', 'mobile workstation'],
    'Desktops': ['desktop', 'pc', 'workstation', 'tower'],
    'All-in-One': ['all-in-one', 'aio', 'all in one'],
    'Mini PCs': ['mini pc', 'nuc', 'mini computer'],
    'Thin Clients': ['thin client', 'zero client']
  },
  'Components': {
    'Processors': ['cpu', 'processor', 'intel', 'amd'],
    'Graphics Cards': ['graphics card', 'gpu', 'video card'],
    'Memory': ['ram', 'memory', 'ddr4', 'ddr5', 'dimm'],
    'Storage': ['ssd', 'hdd', 'hard drive', 'nvme', 'm.2'],
    'Motherboards': ['motherboard', 'mainboard', 'mobo'],
    'Power Supplies': ['psu', 'power supply', 'ups'],
    'Cooling': ['cpu cooler', 'fan', 'heatsink', 'thermal paste']
  },
  'Networking': {
    'Routers': ['router', 'wireless router', 'gateway'],
    'Switches': ['switch', 'network switch', 'ethernet switch'],
    'Access Points': ['access point', 'ap', 'wifi ap'],
    'Firewalls': ['firewall', 'utm', 'security appliance'],
    'Network Cards': ['network card', 'nic', 'ethernet card'],
    'Cables & Connectors': ['ethernet cable', 'network cable', 'patch cable', 'cat5', 'cat6']
  },
  'Peripherals': {
    'Monitors': ['monitor', 'display', 'screen', 'lcd', 'led'],
    'Keyboards': ['keyboard', 'mechanical keyboard'],
    'Mice': ['mouse', 'trackball', 'pointing device'],
    'Webcams': ['webcam', 'camera', 'usb camera'],
    'Speakers': ['speaker', 'audio', 'sound system'],
    'Headsets': ['headset', 'headphone', 'microphone']
  },
  'Storage & Backup': {
    'External Drives': ['external drive', 'portable drive', 'usb drive'],
    'NAS': ['nas', 'network attached storage', 'storage server'],
    'Backup Solutions': ['backup', 'tape drive', 'backup system'],
    'Storage Enclosures': ['storage enclosure', 'disk enclosure']
  },
  'Servers & Enterprise': {
    'Rack Servers': ['rack server', 'server', '1u server', '2u server'],
    'Tower Servers': ['tower server', 'server'],
    'Server Components': ['server cpu', 'server memory', 'server storage'],
    'Rack Accessories': ['rack', 'rack mount', 'pdu', 'kvm']
  },
  'Printers & Scanners': {
    'Printers': ['printer', 'inkjet', 'laser printer'],
    'Scanners': ['scanner', 'document scanner'],
    'Multifunction': ['multifunction', 'mfp', 'all-in-one printer'],
    'Printer Supplies': ['toner', 'ink', 'printer cartridge']
  },
  'Security & Surveillance': {
    'IP Cameras': ['ip camera', 'security camera', 'cctv'],
    'DVR/NVR': ['dvr', 'nvr', 'video recorder'],
    'Access Control': ['access control', 'card reader', 'biometric'],
    'Security Software': ['antivirus', 'security software', 'endpoint protection']
  },
  'Software & Licensing': {
    'Operating Systems': ['windows', 'linux', 'operating system', 'os'],
    'Office Software': ['office', 'microsoft office', 'productivity'],
    'Security Software': ['antivirus', 'security', 'endpoint protection'],
    'Virtualization': ['vmware', 'hyper-v', 'virtualization']
  },
  'Cables & Accessories': {
    'Cables': ['cable', 'hdmi', 'usb', 'displayport', 'vga', 'dvi'],
    'Adapters': ['adapter', 'converter', 'dongle'],
    'Mounts & Stands': ['mount', 'stand', 'bracket'],
    'Bags & Cases': ['bag', 'case', 'laptop bag', 'carrying case']
  }
};

export default function CategoryBrowser({ 
  selectedCategories, 
  onCategoriesChange,
  onCategoryClick 
}: CategoryBrowserProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // Initialize groups collapsed by default. We will conditionally expand if needed based on selection.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');

  // Effect to determine which groups must be expanded based on current selections
  useEffect(() => {
    if (selectedCategories.length > 0 && viewMode === 'hierarchy') {
      const requiredExpansions = new Set<string>();
      (Object.keys(IT_CATEGORIES_HIERARCHY) as Array<keyof typeof IT_CATEGORIES_HIERARCHY>).forEach((groupName) => {
        const subcategories = IT_CATEGORIES_HIERARCHY[groupName];
        Object.keys(subcategories).forEach(subcategoryName => {
          // Check if any selected category matches this subcategory name/keyword
          const subcategoryKeywords = subcategories[subcategoryName as keyof typeof subcategories];
          if (selectedCategories.some(selected => 
              subcategoryName.toLowerCase().includes(selected.toLowerCase()) ||
              subcategoryKeywords.some(term => selected.toLowerCase().includes(term.toLowerCase()))
          )) {
            requiredExpansions.add(groupName);
          }
        });
      });
      setExpandedGroups(requiredExpansions);
    } else {
      // If search is active or no categories selected, keep collapsed by default
      setExpandedGroups(new Set());
    }
  }, [selectedCategories, viewMode]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?include_counts=true');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newSelection = selectedCategories.includes(categoryName)
      ? selectedCategories.filter(c => c !== categoryName)
      : [...selectedCategories, categoryName];
    onCategoriesChange(newSelection);
    
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupName)) {
        newExpanded.delete(groupName);
      } else {
        newExpanded.add(groupName);
      }
      return newExpanded;
    });
  };

  const getCategoryCount = (categoryName: string): number => {
    const category = categories.find(c => 
      c.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.count || 0;
  };

  const filteredCategories = useMemo(() => {
    if (searchQuery === '') return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

  // Simplified rendering for hierarchy based on search mode
  const renderHierarchy = () => {
    if (searchQuery !== '') {
        // If searching, switch to flat mode showing only top-level matches for simplicity
        return renderFlat(); 
    }

    return (
        <div className="space-y-4">
            {(Object.keys(IT_CATEGORIES_HIERARCHY) as Array<keyof typeof IT_CATEGORIES_HIERARCHY>).map((groupName) => {
                const subcategories = IT_CATEGORIES_HIERARCHY[groupName];
                const isExpanded = expandedGroups.has(groupName);
                
                // Calculate if the group or any of its subcategories have selected items or match the search term
                const groupHasSelectionOrMatch = selectedCategories.some(selected => {
                    // Check if selected category is within this group's subcategory names/keywords
                    return Object.entries(subcategories).some(([, terms]) => 
                        terms.some(term => selected.toLowerCase().includes(term.toLowerCase())) || 
                        selected.toLowerCase().includes(groupName.toLowerCase())
                    );
                });

                // Only render group if it has selected items or is expanded
                if (!groupHasSelectionOrMatch && !isExpanded && searchQuery === '') {
                   return null;
                }

                return (
                    <div key={groupName} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(groupName)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 flex items-center justify-between hover:from-orange-100 hover:to-orange-100 dark:hover:from-gray-600 transition-colors"
                        >
                            <span className="font-black text-gray-900 dark:text-gray-100">{groupName}</span>
                            <svg
                                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Subcategories - Render only if expanded */}
                        {isExpanded && (
                            <div className="p-4 space-y-2 bg-white dark:bg-gray-800">
                                {Object.entries(subcategories).map(([subcategoryName]) => {
                                    // Find the actual category name from the DB results that maps to this subcategory structure
                                    const actualCategoryMatch = categories.find(c => 
                                        c.name.toLowerCase() === subcategoryName.toLowerCase() || 
                                        c.name.toLowerCase().includes(subcategoryName.toLowerCase()) ||
                                        IT_CATEGORIES_HIERARCHY[groupName][subcategoryName as keyof typeof subcategories].some(term => c.name.toLowerCase().includes(term.toLowerCase()))
                                    );
                                    
                                    const categoryName = actualCategoryMatch?.name || subcategoryName;
                                    const count = actualCategoryMatch?.count || 0;
                                    const isSelected = selectedCategories.includes(categoryName);

                                    return (
                                        <button
                                            key={subcategoryName}
                                            onClick={() => toggleCategory(categoryName)}
                                            className={`w-full px-4 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                                                isSelected
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <span className="font-semibold">{categoryName}</span>
                                            {count > 0 && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                            }`}>
                                                {count}
                                            </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  }

  const renderFlat = () => {
    const displayCategories = searchQuery === '' ? categories : filteredCategories;
    
    return (
        <div className="space-y-2">
            {displayCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No categories found matching "{searchQuery}"
                </div>
            ) : (
                displayCategories.map((category) => {
                    const isSelected = selectedCategories.includes(category.name);
                    return (
                        <button
                            key={category.name}
                            onClick={() => toggleCategory(category.name)}
                            className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                                isSelected
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span className="font-semibold">{category.name}</span>
                            {category.count !== undefined && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            }`}>
                                {category.count}
                            </span>
                            )}
                        </button>
                    );
                })
            )}
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
            Browse Categories
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Hierarchy
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'flat'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              All Categories
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Selected Categories Count */}
        {selectedCategories.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase">Selected:</span>
            <span className="text-sm font-black text-orange-600">{selectedCategories.length}</span>
            <button
              onClick={() => onCategoriesChange([])}
              className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {searchQuery !== '' ? renderFlat() : (
            viewMode === 'hierarchy' ? renderHierarchy() : renderFlat()
        )}
      </div>
    </div>
  );
}