import React from 'react';
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
            alert(`Order template for ${label} copied to clipboard!`);
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
            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Templates</h2>
                        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Grouped by Project & Supplier</p>
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
                                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tighter italic">
                                        <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                        {supplier}
                                    </h3>
                                    <button
                                        onClick={() => copyToClipboard(template, supplier)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        Copy Template
                                    </button>
                                </div>
                                <div className="relative group">
                                    <pre className="bg-gray-900 text-gray-300 p-8 rounded-3xl text-[10px] font-mono leading-relaxed overflow-x-auto border border-gray-800 shadow-2xl">
                                        {template}
                                    </pre>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Grand Total (Inc VAT)</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter italic">R {formatPrice(totalIncVat)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
}
