'use client';

import React, { useState } from 'react';
import { CartItem, UserRole, Project } from '../types';
import { calculatePrice, formatPrice, PricingSettings } from '@/lib/pricing';

type ProjectOrderModalProps = {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    projects: Project[];
    totalExVat: number;
    totalIncVat: number;
    userRole: UserRole;
}

export default function OrderModal({ isOpen, onClose, items, projects, totalExVat, totalIncVat, userRole }: ProjectOrderModalProps) {
    const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);

    if (!isOpen) return null;

    // Default pricing settings
    const pricingSettings: PricingSettings = {
        public_markup: 15,
        team_markup: 10,
        management_markup: 5,
        admin_markup: 0
    };

    // Group items by supplier
    const itemsBySupplier: Record<string, CartItem[]> = {};
    items.forEach(item => {
        const key = userRole === 'public' ? 'WhosGotStock' : item.supplier_name;
        if (!itemsBySupplier[key]) {
            itemsBySupplier[key] = [];
        }
        itemsBySupplier[key].push(item);
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedSupplier(label);
            setTimeout(() => setCopiedSupplier(null), 2000);
        }).catch(() => {
            alert('Failed to copy to clipboard. Please copy manually.');
        });
    };

    const getTemplateForSupplier = (supplier: string, supplierItems: CartItem[]) => {
        let template = `--- ${userRole === 'public' ? 'QUOTE' : 'ORDER'} REQUEST: ${supplier.toUpperCase()} ---\n\n`;
        template += "Dear " + (userRole === 'public' ? "Support Team" : "Account Manager") + ",\n\n";
        template += "Please process the following " + (userRole === 'public' ? "quote request" : "order") + ":\n\n";

        // Group supplier items by project
        const byProject: Record<string, CartItem[]> = {};
        supplierItems.forEach(item => {
            const pName = projects.find(p => p.id === item.projectId)?.name || 'GENERAL / UNASSIGNED';
            if (!byProject[pName]) byProject[pName] = [];
            byProject[pName].push(item);
        });

        Object.entries(byProject).forEach(([projectName, pItems]) => {
            template += `[ ${projectName.toUpperCase()} ]\n`;
            pItems.forEach(item => {
                let data: any = {};
                try {
                    if (typeof item.raw_data === 'string') {
                        data = JSON.parse(item.raw_data);
                    } else if (item.raw_data && typeof item.raw_data === 'object') {
                        data = item.raw_data;
                    }
                } catch (e) {
                    data = {};
                }

                const supplierSlug = (data as any)?.supplier_slug || item.supplier_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
                const supplierRef = userRole === 'public' ? `[Ref: ${supplierSlug}]` : '';
                template += `- SKU: ${item.supplier_sku} ${supplierRef} | Qty: ${item.quantity} | Item: ${item.name}\n`;
            });
            template += '\n';
        });

        // Calculate supplier total using centralized pricing logic
        const supplierTotalEx = supplierItems.reduce((sum, item) => {
            const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
            return sum + (parseFloat(price.exVat) * item.quantity);
        }, 0);

        template += `Estimated Subtotal (Ex VAT): R ${formatPrice(supplierTotalEx)}\n`;
        template += "\nRegards,\n[Your Name]";
        return template;
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-950 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white dark:border-gray-900 animate-in zoom-in-95 fade-in duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-850 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Order Packages</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Grouped by Project & Supplier</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {Object.entries(itemsBySupplier).map(([supplier, supplierItems]) => {
                        const template = getTemplateForSupplier(supplier, supplierItems);
                        const isCopied = copiedSupplier === supplier;
                        const supplierTotalEx = supplierItems.reduce((sum, item) => {
                            const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
                            return sum + (parseFloat(price.exVat) * item.quantity);
                        }, 0);

                        return (
                            <div key={supplier} className="bg-gray-50/50 dark:bg-gray-900/30 p-5 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
                                            <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                                            {supplier} Package
                                        </h3>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">
                                            {supplierItems.length} unique products • Subtotal: R {formatPrice(supplierTotalEx)} (Ex VAT)
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(template, supplier)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${
                                            isCopied 
                                                ? 'bg-green-600 text-white shadow-green-100' 
                                                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'
                                        }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                ✓ Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                Copy Template
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="relative">
                                    <pre className="bg-gray-950 text-gray-300 p-5 rounded-xl text-[10px] font-mono leading-relaxed overflow-x-auto border border-gray-800 select-all shadow-inner">
                                        {template}
                                    </pre>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Grand Total (Inc VAT)</p>
                        <p className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">R {formatPrice(totalIncVat)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md active:scale-95"
                    >
                        Close Packages
                    </button>
                </div>
            </div>
        </div>
    );
}
