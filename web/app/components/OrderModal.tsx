'use client';

import React from 'react';
import { CartItem, UserRole } from '../types';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    totalExVat: number;
    totalIncVat: number;
    userRole: UserRole;
}

export default function OrderModal({ isOpen, onClose, items, totalExVat, totalIncVat, userRole }: OrderModalProps) {
    if (!isOpen) return null;

    // Group items by supplier
    const itemsBySupplier: Record<string, CartItem[]> = {};
    items.forEach(item => {
        const key = userRole === 'public' ? 'Smart Integrate' : item.supplier_name;
        if (!itemsBySupplier[key]) {
            itemsBySupplier[key] = [];
        }
        itemsBySupplier[key].push(item);
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Order template for ${label} copied to clipboard!`);
        });
    };

    const getTemplateForSupplier = (supplier: string, supplierItems: CartItem[]) => {
        let template = `--- ${userRole === 'public' ? 'QUOTE' : 'ORDER'} REQUEST: ${supplier.toUpperCase()} ---\n\n`;
        template += "Dear " + (userRole === 'public' ? "Support Team" : "Account Manager") + ",\n\n";
        template += "Please process the following " + (userRole === 'public' ? "quote request" : "order") + ":\n\n";

        supplierItems.forEach(item => {
            const supplierSlug = (item as any).raw_data ? JSON.parse(item.raw_data).supplier_slug || 'N/A' : 'N/A';
            template += `- SKU: ${item.supplier_sku} ${userRole === 'public' ? `[Ref: ${item.supplier_name}]` : ''} | Qty: ${item.quantity} | Item: ${item.name}\n`;
        });

        const supplierTotalEx = supplierItems.reduce((sum, i) => sum + (parseFloat(i.price_ex_vat) * (1.15) * i.quantity), 0); // Assuming 15% markup logic consistent with calculatePrice
        // Note: For simplicity, we use a quick calculation here. In a real app, we'd pass the calculated prices.

        template += `\nEstimated Subtotal (Ex VAT): R ${supplierTotalEx.toFixed(2)}\n`;
        template += "\nRegards,\n[Your Name]";
        return template;
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Templates</h2>
                        <p className="text-gray-500 text-sm mt-1">Copy the templates below for each of your account managers.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all active:scale-90">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {Object.entries(itemsBySupplier).map(([supplier, supplierItems]) => {
                        const template = getTemplateForSupplier(supplier, supplierItems);
                        return (
                            <div key={supplier} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
                                        <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                                        {supplier}
                                    </h3>
                                    <button
                                        onClick={() => copyToClipboard(template, supplier)}
                                        className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 border border-blue-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        Copy Template
                                    </button>
                                </div>
                                <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl text-xs font-mono leading-relaxed overflow-x-auto border border-gray-800 shadow-inner">
                                        {template}
                                    </pre>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Grand Total (Inc VAT)</p>
                        <p className="text-3xl font-black text-blue-700 tracking-tighter">R {totalIncVat.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
