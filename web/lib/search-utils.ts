// Search utilities for better matching and synonyms

export const searchSynonyms: Record<string, string[]> = {
  // Graphics/GPU
  'graphics card': ['graphic card', 'gpu', 'video card', 'graphics cards', 'graphic cards', 'vga', 'graphics adapter'],
  'graphic card': ['graphics card', 'gpu', 'video card', 'graphics cards', 'graphic cards'],
  'gpu': ['graphics card', 'graphic card', 'video card', 'graphics processing unit'],
  'video card': ['graphics card', 'graphic card', 'gpu'],
  
  // Storage
  'ssd': ['solid state drive', 'solid-state drive', 'flash drive', 'nvme', 'm.2'],
  'hdd': ['hard drive', 'hard disk drive', 'mechanical drive', 'spinning disk'],
  'hard drive': ['hdd', 'hard disk drive', 'storage drive'],
  'nvme': ['ssd', 'm.2', 'pcie ssd'],
  'm.2': ['nvme', 'ssd', 'm2'],
  
  // Memory
  'ram': ['memory', 'system memory', 'ddr4', 'ddr5', 'ddr3', 'memory module', 'dimm', 'sodimm'],
  'memory': ['ram', 'system memory', 'ddr4', 'ddr5'],
  'ddr4': ['ram', 'memory', 'ddr4 memory'],
  'ddr5': ['ram', 'memory', 'ddr5 memory'],
  
  // Processors
  'cpu': ['processor', 'central processing unit', 'chip'],
  'processor': ['cpu', 'central processing unit'],
  
  // Networking
  'router': ['wireless router', 'wifi router', 'network router', 'gateway'],
  'switch': ['network switch', 'ethernet switch', 'managed switch', 'unmanaged switch'],
  'access point': ['ap', 'wireless access point', 'wifi access point', 'wifi ap'],
  'firewall': ['network firewall', 'security appliance', 'utm'],
  'network switch': ['switch', 'ethernet switch'],
  
  // Servers & Enterprise
  'server': ['rack server', 'tower server', 'blade server', 'enterprise server'],
  'rack': ['rack mount', 'rackmount', 'server rack'],
  
  // Common IT terms
  'laptop': ['notebook', 'portable computer', 'mobile workstation'],
  'notebook': ['laptop', 'portable computer'],
  'desktop': ['pc', 'computer', 'workstation', 'tower'],
  'monitor': ['display', 'screen', 'lcd', 'led', 'panel'],
  'keyboard': ['kb', 'mechanical keyboard'],
  'mouse': ['mice', 'pointing device'],
  
  // Cables & Connectors
  'cable': ['cord', 'wire', 'patch cable'],
  'ethernet cable': ['network cable', 'cat5', 'cat6', 'cat6a', 'patch cable'],
  'hdmi': ['hdmi cable', 'hdmi connector'],
  'usb': ['usb cable', 'usb connector'],
  
  // Printers & Scanners
  'printer': ['inkjet', 'laser printer', 'multifunction'],
  'scanner': ['document scanner', 'flatbed scanner'],
  
  // Security & Surveillance
  'camera': ['ip camera', 'security camera', 'surveillance camera', 'cctv'],
  'security': ['surveillance', 'cctv', 'security system'],
  
  // Power & UPS
  'ups': ['uninterruptible power supply', 'battery backup', 'power backup'],
  'power supply': ['psu', 'power unit'],
  
  // Brands (common misspellings and abbreviations)
  'cisco': ['cysco'],
  'mikrotik': ['mikro tik', 'micro tik', 'routeros'],
  'ubiquiti': ['ubnt', 'unifi'],
  'tp-link': ['tplink', 'tp link'],
  'hp': ['hewlett packard', 'hewlett-packard'],
  'dell': ['dell technologies'],
  'lenovo': ['thinkpad', 'thinkcentre'],
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