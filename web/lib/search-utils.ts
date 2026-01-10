// Search utilities for better matching and synonyms

export const searchSynonyms: Record<string, string[]> = {
  // Graphics/GPU
  'graphics card': ['graphic card', 'gpu', 'video card', 'graphics cards', 'graphic cards', 'vga', 'graphics adapter'],
  'gpu': ['graphics card', 'graphic card', 'video card', 'graphics processing unit'],
  
  // Storage
  'ssd': ['solid state drive', 'solid-state drive', 'flash drive', 'nvme', 'm.2'],
  'hdd': ['hard drive', 'hard disk drive', 'mechanical drive', 'spinning disk'],
  'nvme': ['ssd', 'm.2', 'pcie ssd'],
  'm.2': ['nvme', 'ssd', 'm2'],
  
  // Memory
  'ram': ['memory', 'system memory', 'ddr4', 'ddr5', 'ddr3', 'memory module', 'dimm', 'sodimm', 'gig', 'gb'],
  '16gb': ['16 gig', '16gig', '16 gb'],
  '8gb': ['8 gig', '8gig', '8 gb'],
  '32gb': ['32 gig', '32gig', '32 gb'],
  '64gb': ['64 gig', '64gig', '64 gb'],
  'gb': ['gig', 'gigabyte'],
  
  // Processors
  'cpu': ['processor', 'central processing unit', 'chip'],
  'i3': ['intel i3', 'core i3'],
  'i5': ['intel i5', 'core i5'],
  'i7': ['intel i7', 'core i7'],
  'i9': ['intel i9', 'core i9'],
  'ryzen': ['amd ryzen'],
  
  // Networking
  'router': ['wireless router', 'wifi router', 'network router', 'gateway'],
  'switch': ['network switch', 'ethernet switch', 'managed switch', 'unmanaged switch'],
  'access point': ['ap', 'wireless access point', 'wifi access point', 'wifi ap'],
  'firewall': ['network firewall', 'security appliance', 'utm'],
  '8 port': ['8port', '8-port'],
  '16 port': ['16port', '16-port'],
  '24 port': ['24port', '24-port'],
  '48 port': ['48port', '48-port'],
  'managed': ['smart managed', 'layer 2', 'layer 3'],
  
  // Common IT terms
  'laptop': ['notebook', 'portable computer', 'mobile workstation', 'laptops'],
  'notebook': ['laptop', 'portable computer', 'notebooks'],
  'desktop': ['pc', 'computer', 'workstation', 'tower'],
  'monitor': ['display', 'screen', 'lcd', 'led', 'panel'],
  
  // Brands
  'ubiquiti': ['ubnt', 'unifi', 'uap', 'usw'],
  'mikrotik': ['routerboard', 'rb', 'ccr', 'crs'],
};

/**
 * Splits a query into logical components and expands each with synonyms.
 * Example: "i5 16gb ram" -> [["i5", "intel i5"], ["16gb", "16gig"], ["ram", "memory"]]
 */
export function expandQueryToGroups(query: string): string[][] {
  const normalized = normalizeSearchQuery(query);
  const words = normalized.split(' ').filter(w => w.length > 1);
  
  return words.map(word => {
    const group = [word];
    
    // Check for exact synonym matches
    if (searchSynonyms[word]) {
      group.push(...searchSynonyms[word]);
    }
    
    // Check for partial matches in synonym keys (e.g. "8-port" matches key "8 port")
    Object.entries(searchSynonyms).forEach(([key, synonyms]) => {
      if (word !== key && (word.includes(key) || key.includes(word))) {
        // Only add if it's a meaningful match (e.g. not "i" in "intel")
        if (key.length > 2 && word.length > 2) {
          group.push(...synonyms);
        }
      }
    });
    
    return [...new Set(group)];
  });
}

export function expandSearchTerms(query: string): string[] {
  const terms = [query.toLowerCase().trim()];
  
  Object.entries(searchSynonyms).forEach(([key, synonyms]) => {
    if (query.toLowerCase().includes(key)) {
      terms.push(...synonyms);
    }
  });
  
  return [...new Set(terms)];
}

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}
