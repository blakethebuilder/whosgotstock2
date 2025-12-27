export type UserRole = 'free' | 'professional' | 'enterprise' | 'staff' | 'partner';

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
}

export interface Supplier {
    name: string;
    slug: string;
    url: string;
    type: string;
    enabled: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface UsageStats {
    searchesThisMonth: number;
    searchLimit: number;
    quotesGenerated: number;
    isLimitReached: boolean;
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
