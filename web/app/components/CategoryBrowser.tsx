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

// Define explicit types for the hierarchy to ensure robust indexing
type SubCategoryMap = Record<string, string[]>;
type CategoryHierarchy = Record<string, SubCategoryMap>;

const IT_CATEGORIES_HIERARCHY: CategoryHierarchy = {
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy');

  useEffect(() => {
    if (selectedCategories.length > 0 && viewMode === 'hierarchy') {
      const requiredExpansions = new Set<string>();
      (Object.entries(IT_CATEGORIES_HIERARCHY) as Array<[keyof CategoryHierarchy, SubCategoryMap]>).forEach(([groupName, subcategories]) => {
        (Object.entries(subcategories) as Array<[string, string[]]>).forEach(([subcategoryName, keywords]) => {
          if (selectedCategories.some(selected => 
              subcategoryName.toLowerCase().includes(selected.toLowerCase()) ||
              keywords.some(term => selected.toLowerCase().includes(term.toLowerCase()))
          )) {
            requiredExpansions.add(groupName);
          }
        });
      });
      setExpandedGroups(requiredExpansions);
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

  const filteredCategories = useMemo(() => {
    if (searchQuery === '') return categories;
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

  const renderHierarchy = () => {
    if (searchQuery !== '') return renderFlat(); 

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(IT_CATEGORIES_HIERARCHY) as Array<keyof typeof IT_CATEGORIES_HIERARCHY>).map((groupName) => {
                const subcategories = IT_CATEGORIES_HIERARCHY[groupName];
                const isExpanded = expandedGroups.has(groupName);
                
                const groupHasSelection = selectedCategories.some(selected => {
                    return Object.entries(subcategories).some(([, terms]) => 
                        terms.some(term => selected.toLowerCase().includes(term.toLowerCase())) || 
                        selected.toLowerCase().includes(groupName.toLowerCase())
                    );
                });

                return (
                    <div key={groupName} className={`rounded-[2rem] transition-all border ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-800/50 border-orange-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-orange-500/20 hover:bg-gray-50/30'}`}>
                        <button
                            onClick={() => toggleGroup(groupName)}
                            className="w-full p-6 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${groupHasSelection ? 'bg-orange-500 animate-pulse' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                <span className="font-black text-gray-900 dark:text-white tracking-tight">{groupName}</span>
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-all ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </button>

                        {isExpanded && (
                            <div className="px-6 pb-6 pt-0 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                {Object.entries(subcategories).map(([subcategoryName]) => {
                                    const actualCategoryMatch = categories.find(c => 
                                        c.name.toLowerCase() === subcategoryName.toLowerCase() || 
                                        c.name.toLowerCase().includes(subcategoryName.toLowerCase()) ||
                                        (IT_CATEGORIES_HIERARCHY[groupName][subcategoryName] as string[]).some(term => c.name.toLowerCase().includes(term.toLowerCase()))
                                    );
                                    
                                    const categoryName = actualCategoryMatch?.name || subcategoryName;
                                    const count = actualCategoryMatch?.count || 0;
                                    const isSelected = selectedCategories.includes(categoryName);

                                    return (
                                        <button
                                            key={subcategoryName}
                                            onClick={() => toggleCategory(categoryName)}
                                            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                                                isSelected
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg'
                                                : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:text-orange-500 hover:border-orange-500/20'
                                            }`}
                                        >
                                            {subcategoryName} {count > 0 && <span className="opacity-50 ml-1">({count})</span>}
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
        <div className="flex flex-wrap gap-3">
            {displayCategories.length === 0 ? (
                <div className="w-full text-center py-12 text-gray-400 font-black uppercase text-xs tracking-widest">
                    No matching categories
                </div>
            ) : (
                displayCategories.map((category) => {
                    const isSelected = selectedCategories.includes(category.name);
                    return (
                        <button
                            key={category.name}
                            onClick={() => toggleCategory(category.name)}
                            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                                isSelected
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg'
                                : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-800 hover:text-orange-500 hover:border-orange-500/30'
                            }`}
                        >
                            {category.name} {category.count !== undefined && <span className="opacity-50 ml-2">({category.count})</span>}
                        </button>
                    );
                })
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
              Categorical <span className="text-orange-500">Drilldown.</span>
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Refine your live feed results</p>
          </div>
          <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <button onClick={() => setViewMode('hierarchy')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'hierarchy' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>Structure</button>
            <button onClick={() => setViewMode('flat')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'flat' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>All Tags</button>
          </div>
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search thousands of categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pl-14 rounded-2xl bg-white dark:bg-gray-800 border-none text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-orange-500/20 outline-none shadow-sm group-focus-within:shadow-xl transition-all"
          />
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {selectedCategories.length > 0 && (
          <div className="mt-6 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Active:</span>
            <div className="flex flex-wrap gap-2">
                {selectedCategories.map(cat => (
                    <div key={cat} className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-black">
                        {cat}
                        <button onClick={() => toggleCategory(cat)} className="hover:text-red-400 transition-colors">×</button>
                    </div>
                ))}
            </div>
            <button onClick={() => onCategoriesChange([])} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest ml-auto">Clear All</button>
          </div>
        )}
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900">
        {viewMode === 'hierarchy' ? renderHierarchy() : renderFlat()}
      </div>
    </div>
  );
}