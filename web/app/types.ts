/**
 * Global Type Definitions for WhosGotStock
 */

export type UserRole = 'public' | 'team' | 'management' | 'admin';

export type Product = {
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
};

export type Supplier = {
    name: string;
    slug: string;
    url: string;
    type: string;
    enabled: boolean;
};

export type Project = {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    createdAt: number;
};

export type CartItem = Product & {
    quantity: number;
    projectId?: string;
};

export type UsageStats = {
    searchesThisMonth: number;
    searchLimit: number;
    quotesGenerated: number;
    isLimitReached: boolean;
    totalProducts?: number;
    totalSuppliers?: number;
};

export type TierFeatures = {
    name: string;
    price: string;
    searches: string;
    markup: string;
    features: string[];
    cta: string;
    popular?: boolean;
};
