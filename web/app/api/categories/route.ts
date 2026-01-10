import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCached, setCache } from '@/lib/cache';

export async function GET(request: Request) {
  // IT Product Categories Hierarchy definition moved inside the function body
  const IT_CATEGORIES = {
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

  try {
    const { searchParams } = new URL(request.url);
    const supplier = searchParams.get('supplier');
    const includeCounts = searchParams.get('include_counts') === 'true';

    // Cache key
    const cacheKey = `categories:${supplier || 'all'}:${includeCounts}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const client = await pool.connect();

    try {
      let categories: any[] = [];

      if (includeCounts) {
        // Get categories with product counts from all tables
        const categoryQuery = `
          SELECT 
            category,
            supplier_name,
            COUNT(*) as count
          FROM (
            SELECT p.category, s.name as supplier_name
            FROM products p
            JOIN suppliers s ON p.supplier_name = s.name
            WHERE p.category IS NOT NULL AND p.category != '' AND s.enabled = true
            ${supplier ? `AND s.slug = $1` : ''}
            
            UNION ALL
            
            -- *** Removed EvenFlow, Linkqage, Manual products as per user instruction ***
            
            SELECT category, supplier_name
            FROM manual_supplier_products
            WHERE category IS NOT NULL AND category != ''
            ${supplier ? `AND LOWER(REPLACE(REPLACE(supplier_name, ' ', '-'), '.', '')) = $1` : ''}
          ) combined
          GROUP BY category, supplier_name
          ORDER BY category, supplier_name
        `;

        const params = supplier ? [supplier] : [];
        const result = await client.query(categoryQuery, params);

        // Group by category and aggregate counts
        const categoryMap = new Map<string, { total: number; bySupplier: Record<string, number> }>();

        result.rows.forEach((row: any) => {
          const cat = row.category.trim();
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { total: 0, bySupplier: {} });
          }
          const entry = categoryMap.get(cat)!;
          entry.total += parseInt(row.count);
          entry.bySupplier[row.supplier_name] = parseInt(row.count);
        });

        categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
          name,
          count: data.total,
          bySupplier: data.bySupplier
        })).sort((a, b) => b.count - a.count);
      } else {
        // Just return category names
        const categoryQuery = `
          SELECT DISTINCT category
          FROM (
            SELECT category FROM products WHERE category IS NOT NULL AND category != ''
            UNION
            SELECT category FROM manual_supplier_products WHERE category IS NOT NULL AND category != ''
          ) combined
          ORDER BY category
        `;

        const result = await client.query(categoryQuery);
        categories = result.rows.map((row: any) => ({ name: row.category }));
      }

      client.release();

      const response = {
        categories,
        hierarchy: IT_CATEGORIES, // Now defined inside, not exported globally
        total: categories.length
      };

      // Cache for 5 minutes
      setCache(cacheKey, response, 300000);

      return NextResponse.json(response);
    } catch (err: any) {
      client.release();
      throw err;
    }
  } catch (err: any) {
    console.error('Categories API error:', err);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      categories: [],
      hierarchy: IT_CATEGORIES // IT_CATEGORIES is defined here, so it's available
    }, { status: 500 });
  }
}