'use client';

import { useState, useEffect } from 'react';
import OrderModal from './OrderModal';
import SiteManagementModal from './SiteManagementModal';
import { CartItem, UserRole, Project } from '../types';
import { calculatePrice, formatPrice, PricingSettings } from '@/lib/pricing';

type QuoteDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    projects: Project[];
    addProject: (name: string) => string | null;
    removeProject: (id: string) => void;
    updateItemProject: (itemId: number, projectId?: string) => void;
    updateQuantity: (id: number, delta: number) => void;
    removeItem: (id: number) => void;
    userRole: UserRole;
    pricingSettings: PricingSettings;
}

export default function CartDrawer({
    isOpen,
    onClose,
    items,
    projects,
    addProject,
    removeProject,
    updateItemProject,
    updateQuantity,
    removeItem,
    userRole,
    pricingSettings
}: QuoteDrawerProps) {
    const [mounted, setMounted] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isSiteManagerOpen, setShowSiteManager] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [showProjectAdd, setShowProjectAdd] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const totalExVat = items.reduce((sum, item) => {
        const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        return sum + parseFloat(price.exVat) * item.quantity;
    }, 0);

    const totalIncVat = items.reduce((sum, item) => {
        const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        return sum + parseFloat(price.incVat) * item.quantity;
    }, 0);

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            const result = addProject(newProjectName.trim());
            if (result) {
                setNewProjectName('');
                setShowProjectAdd(false);
            }
        }
    };

    const generateEmailTemplate = () => {
        fetch('/api/admin/quote-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items,
                totalExVat,
                totalIncVat,
                userRole,
                projects
            })
        }).catch(err => console.error('Failed to log quote:', err));

        setIsOrderModalOpen(true);
    };

    const renderItem = (item: CartItem) => {
        const itemPrice = calculatePrice(item.price_ex_vat, userRole, pricingSettings);

        return (
            <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight pr-2">{item.name}</h3>
                        <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-widest font-black flex items-center gap-2">
                        <span className="text-orange-500">{item.brand}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{item.supplier_name}</span>
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1">
                            <label className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Assigned Site</label>
                            <select
                                value={item.projectId || ''}
                                onChange={(e) => updateItemProject(item.id, e.target.value || undefined)}
                                className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline/none focus:border-orange-500 transition-all w-full appearance-none cursor-pointer"
                            >
                                <option value="">Main Quote (Unassigned)</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all font-black text-lg border border-transparent hover:border-orange-100"
                            >
                                -
                            </button>
                            <span className="text-sm font-black w-4 text-center text-gray-900 tabular-nums">{item.quantity}</span>
                            <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white rounded-lg transition-all font-black text-lg border border-transparent hover:border-orange-100"
                            >
                                +
                            </button>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-gray-900 italic">R {formatPrice(parseFloat(itemPrice.exVat))}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Per Item (Ex VAT)</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[150] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-[200] transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full bg-gray-50">
                    {/* Header Section */}
                    <div className="bg-white p-8 border-b border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                        </div>

                        <div className="relative z-10 flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Quote Builder</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Multi-Site Hardware Aggregator</p>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 border border-gray-100">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Sites Reference Section */}
                        <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 relative group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Assigned Sites / Projects</h3>
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md text-[8px] font-black uppercase">{projects.length}/3</span>
                                </div>
                                <button
                                    onClick={() => setShowSiteManager(true)}
                                    className="text-[9px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Manage Sites
                                </button>
                            </div>

                            {projects.length === 0 ? (
                                <p className="text-[9px] font-bold text-gray-400 italic">No sites created yet. Click "Manage Sites" to create locations for organizing your hardware.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {projects.map(p => (
                                        <div key={p.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">{p.name}</span>
                                            {p.slug && (
                                                <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-nowrap">Slug: {p.slug}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 grayscale">
                                <div className="p-8 bg-white rounded-full border-4 border-dashed border-gray-100 animate-pulse">
                                    <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <div>
                                    <p className="text-gray-900 font-black text-xl tracking-tighter italic">Aggregator is Idle</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Add items from search to build your quote</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Unassigned Section */}
                                {items.filter(i => !i.projectId).length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Main Quote Bundle</span>
                                            <div className="h-0.5 flex-1 bg-gray-100" />
                                        </div>
                                        <div className="space-y-4">
                                            {items.filter(i => !i.projectId).map(renderItem)}
                                        </div>
                                    </div>
                                )}

                                {/* Site Groupings */}
                                {projects.map(project => {
                                    const projectItems = items.filter(i => i.projectId === project.id);
                                    if (projectItems.length === 0) return null;

                                    return (
                                        <div key={project.id} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900 italic">Site: {project.name}</span>
                                                <div className="h-0.5 flex-1 bg-orange-100/50" />
                                            </div>
                                            <div className="grid gap-4">
                                                {projectItems.map(renderItem)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Pricing Footer */}
                    {items.length > 0 && (
                        <div className="bg-white p-8 border-t border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.03)] space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Procurement Subtotal</span>
                                    <span className="text-gray-900 font-mono tracking-tighter">R {formatPrice(totalExVat)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest block mb-1 leading-none">Estimated Total</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">Inc. VAT</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-gray-900 tracking-tighter italic leading-none">R {formatPrice(totalIncVat)}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={generateEmailTemplate}
                                className="w-full bg-gray-900 hover:bg-orange-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-gray-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <span className="uppercase tracking-[0.2em] text-xs">Generate Detailed Site Packages</span>
                            </button>

                            <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.3em] opacity-40">
                                Global Supply Network • Built in South Africa
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                items={items}
                projects={projects}
                totalExVat={totalExVat}
                totalIncVat={totalIncVat}
                userRole={userRole}
            />

        </>
    );
}
