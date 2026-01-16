export type UserRole = 'public' | 'team' | 'management' | 'admin';

export interface Product {
    id: number;
    name: string;
    brand: string;
    price_ex_vat: string;
    qty_on_hand: number;
    supplier_sku: string;
    supplier_name: string;
    image_url: string;
    category: string;
    description?: string;
    raw_data: any;
    stock_jhb?: number;
    stock_cpt?: number;
    price_on_request?: boolean;
}

export interface Supplier {
    name: string;
    slug: string;
    url: string;
    type: string;
    enabled: boolean;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
}

export interface CartItem extends Product {
    quantity: number;
    projectId?: string; // Optional reference to a project
}

export interface UsageStats {
    searchesThisMonth: number;
    searchLimit: number;
    quotesGenerated: number;
    isLimitReached: boolean;
    totalProducts?: number;
    totalSuppliers?: number;
}

export interface TierFeatures {
    name: string;
    price: string;
    searches: string;
    markup: string;
    features: string[];
    cta: string;
    popular?: boolean;
}
