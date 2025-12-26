// Search utilities for better matching and synonyms

export const searchSynonyms: Record<string, string[]> = {
  // Graphics/GPU
  'graphics card': ['graphic card', 'gpu', 'video card', 'graphics cards', 'graphic cards'],
  'graphic card': ['graphics card', 'gpu', 'video card', 'graphics cards', 'graphic cards'],
  'gpu': ['graphics card', 'graphic card', 'video card', 'graphics processing unit'],
  'video card': ['graphics card', 'graphic card', 'gpu'],
  
  // Storage
  'ssd': ['solid state drive', 'solid-state drive', 'flash drive'],
  'hdd': ['hard drive', 'hard disk drive', 'mechanical drive'],
  'hard drive': ['hdd', 'hard disk drive', 'storage drive'],
  
  // Memory
  'ram': ['memory', 'system memory', 'ddr4', 'ddr5'],
  'memory': ['ram', 'system memory'],
  
  // Processors
  'cpu': ['processor', 'central processing unit'],
  'processor': ['cpu', 'central processing unit'],
  
  // Networking
  'router': ['wireless router', 'wifi router', 'network router'],
  'switch': ['network switch', 'ethernet switch'],
  'access point': ['ap', 'wireless access point', 'wifi access point'],
  
  // Common IT terms
  'laptop': ['notebook', 'portable computer'],
  'notebook': ['laptop', 'portable computer'],
  'desktop': ['pc', 'computer', 'workstation'],
  'monitor': ['display', 'screen', 'lcd', 'led'],
  'keyboard': ['kb'],
  'mouse': ['mice'],
  
  // Brands (common misspellings)
  'cisco': ['cysco'],
  'mikrotik': ['mikro tik', 'micro tik'],
  'ubiquiti': ['ubnt'],
  'tp-link': ['tplink', 'tp link'],
};

export function expandSearchTerms(query: string): string[] {
  const terms = [query.toLowerCase().trim()];
  
  // Add synonyms
  Object.entries(searchSynonyms).forEach(([key, synonyms]) => {
    if (query.toLowerCase().includes(key)) {
      terms.push(...synonyms);
    }
  });
  
  // Add partial matches (remove 's' for plurals)
  const singular = query.toLowerCase().replace(/s$/, '');
  if (singular !== query.toLowerCase()) {
    terms.push(singular);
  }
  
  // Add plural
  if (!query.toLowerCase().endsWith('s')) {
    terms.push(query.toLowerCase() + 's');
  }
  
  return [...new Set(terms)]; // Remove duplicates
}

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, ' '); // Normalize spaces
}