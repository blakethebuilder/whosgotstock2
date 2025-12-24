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
    raw_data: string;
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
