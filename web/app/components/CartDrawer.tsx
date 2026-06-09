'use client';

import { useState, useEffect, useMemo } from 'react';
import OrderModal from './OrderModal';
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
    clearCart?: () => void;
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
    pricingSettings,
    clearCart
}: QuoteDrawerProps) {
    const [mounted, setMounted] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [showProjectAdd, setShowProjectAdd] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('all');
            setSearchQuery('');
            setCollapsedSections(new Set());
            setIsExpanded(false);
        }
    }, [isOpen]);

    const totalExVat = items.reduce((sum, item) => {
        const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        return sum + parseFloat(price.exVat) * item.quantity;
    }, 0);

    const totalIncVat = items.reduce((sum, item) => {
        const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        return sum + parseFloat(price.incVat) * item.quantity;
    }, 0);

    const siteLimit = useMemo(() => {
        if (userRole === 'team') return 10;
        if (userRole === 'management' || userRole === 'admin') return 999;
        return 3;
    }, [userRole]);

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

    const toggleSection = (sectionId: string) => {
        const newCollapsed = new Set(collapsedSections);
        if (newCollapsed.has(sectionId)) {
            newCollapsed.delete(sectionId);
        } else {
            newCollapsed.add(sectionId);
        }
        setCollapsedSections(newCollapsed);
    };

    const unassignedCount = items.filter(i => !i.projectId).length;
    const getProjectItemCount = (projectId: string) => items.filter(i => i.projectId === projectId).length;

    const filteredItems = useMemo(() => {
        let filtered = items;

        if (activeTab !== 'all') {
            if (activeTab === 'unassigned') {
                filtered = filtered.filter(i => !i.projectId);
            } else {
                filtered = filtered.filter(i => i.projectId === activeTab);
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.name.toLowerCase().includes(query) ||
                i.brand.toLowerCase().includes(query) ||
                i.supplier_name.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [items, activeTab, searchQuery]);

    const tabs = useMemo(() => {
        const result = [{ id: 'all', label: 'All', count: items.length }];
        if (unassignedCount > 0) {
            result.push({ id: 'unassigned', label: 'Main', count: unassignedCount });
        }
        projects.forEach(p => {
            const count = getProjectItemCount(p.id);
            if (count > 0) {
                result.push({ id: p.id, label: p.name, count });
            }
        });
        return result;
    }, [items, projects, unassignedCount]);

    const supplierBreakdowns = useMemo(() => {
        const breakdown: Record<string, number> = {};
        items.forEach(item => {
            const price = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
            const key = item.supplier_name;
            breakdown[key] = (breakdown[key] || 0) + parseFloat(price.exVat) * item.quantity;
        });
        return Object.entries(breakdown).map(([name, total]) => ({ name, total }));
    }, [items, userRole, pricingSettings]);

    const renderItem = (item: CartItem) => {
        const itemPrice = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        const lineTotal = parseFloat(itemPrice.exVat) * item.quantity;

        return (
            <div key={item.id} className="group flex flex-col gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-sm transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 leading-snug tracking-tight hover:text-orange-500 transition-colors" title={item.name}>{item.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            <span>{item.brand}</span>
                            <span>•</span>
                            <span className="text-orange-600/90 dark:text-orange-400">{item.supplier_name}</span>
                            <span>•</span>
                            <span className="font-mono text-[8px]">{item.supplier_sku}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200/50 dark:border-gray-700">
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white dark:hover:bg-gray-700 rounded-l-lg transition-all text-xs font-bold"
                        >
                            −
                        </button>
                        <span className="w-7 text-center text-[10px] font-black text-gray-900 dark:text-white tabular-nums">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white dark:hover:bg-gray-700 rounded-r-lg transition-all text-xs font-bold"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[11px] font-black text-gray-900 dark:text-white tabular-nums">R {formatPrice(lineTotal)}</span>
                        <span className="text-[8px] font-bold text-gray-450 dark:text-gray-500">R {formatPrice(parseFloat(itemPrice.exVat))} ea</span>
                    </div>
                </div>

                {projects.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-50 dark:border-gray-800 mt-0.5">
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Site Assignment:</span>
                        <select
                            value={item.projectId || ''}
                            onChange={(e) => updateItemProject(item.id, e.target.value || undefined)}
                            className="flex-1 text-[9px] font-bold bg-gray-50/50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">Main Quote</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <div className={`fixed right-0 top-0 h-full w-full ${isExpanded ? 'md:max-w-[50vw] sm:max-w-2xl' : 'max-w-md'} bg-gray-50 dark:bg-gray-950 shadow-2xl z-[200] transform transition-transform duration-300 ease-out border-l border-white dark:border-gray-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-850 px-5 py-4 shrink-0 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Quote Builder</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{items.length} item{items.length !== 1 ? 's' : ''} in cart</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {items.length > 0 && clearCart && (
                                    <button
                                        onClick={() => { if (confirm('Empty your current quote builder?')) clearCart(); }}
                                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg transition-all"
                                    >
                                        Clear Cart
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsExpanded(!isExpanded)} 
                                    className="hidden sm:flex w-8 h-8 items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-250"
                                    title={isExpanded ? "Collapse drawer" : "Expand to half screen"}
                                >
                                    {isExpanded ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l-7 7 7 7M20 5l-7 7 7 7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l7-7-7-7M4 19l7-7-7-7" /></svg>
                                    )}
                                </button>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Sites Management */}
                        <div className="space-y-2.5 bg-gray-50/50 dark:bg-gray-800/20 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest">Sites & Locations</span>
                                    <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">
                                        {siteLimit === 999 ? 'Unlimited sites' : `Limit: ${projects.length}/${siteLimit} (${userRole} tier)`}
                                    </span>
                                </div>
                                {projects.length < siteLimit && !showProjectAdd && (
                                    <button
                                        onClick={() => setShowProjectAdd(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-500/5 px-2.5 py-1.5 rounded-lg border border-orange-200/40"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        Add
                                    </button>
                                )}
                            </div>

                            {showProjectAdd ? (
                                <form onSubmit={handleAddProject} className="flex gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Site name..."
                                        className="flex-1 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-100"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                    />
                                    <button type="submit" className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">Add</button>
                                    <button type="button" onClick={() => setShowProjectAdd(false)} className="px-2.5 py-2 text-gray-400 hover:text-gray-650 text-xs font-bold">Cancel</button>
                                </form>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {projects.length === 0 ? (
                                        <p className="text-[10px] text-gray-400 italic font-medium">No custom sites added yet. Items default to Main Quote.</p>
                                    ) : (
                                        projects.map(p => (
                                            <div key={p.id} className="group flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl px-2.5 py-1 shadow-sm transition-all">
                                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                                                <span className="text-[9px] text-gray-400">({getProjectItemCount(p.id)})</span>
                                                <button
                                                    onClick={() => removeProject(p.id)}
                                                    className="w-4 h-4 flex items-center justify-center text-orange-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search & Tabs */}
                    {items.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-850 px-5 py-3 shrink-0 space-y-3 shadow-sm">
                            {items.length > 3 && (
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search builder..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-850 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-100"
                                    />
                                </div>
                            )}

                            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <span className="truncate max-w-[100px]">{tab.label}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                                            activeTab === tab.id ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                        }`}>{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-gray-50/80 dark:bg-gray-950/40">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                <p className="text-sm font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider">Empty Builder</p>
                                <p className="text-xs mt-1 text-gray-400">Add products from results page to organize your quote packages.</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 italic">
                                <p className="text-xs font-bold uppercase tracking-wider">No matching items found</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'all' ? (
                                    <>
                                        {unassignedCount > 0 && (
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => toggleSection('unassigned')}
                                                    className="flex items-center gap-2 w-full text-left focus:outline-none"
                                                >
                                                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${collapsedSections.has('unassigned') ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Main Quote Package</span>
                                                    <span className="text-[9px] text-gray-400 font-bold">({unassignedCount})</span>
                                                </button>
                                                {!collapsedSections.has('unassigned') && (
                                                    <div className="space-y-2 pl-1">
                                                        {items.filter(i => !i.projectId).map(item => (
                                                            renderItem(item)
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {projects.map(project => {
                                            const projectItems = items.filter(i => i.projectId === project.id);
                                            if (projectItems.length === 0) return null;
                                            const isCollapsed = collapsedSections.has(project.id);

                                            return (
                                                <div key={project.id} className="space-y-2">
                                                    <button
                                                        onClick={() => toggleSection(project.id)}
                                                        className="flex items-center gap-2 w-full text-left focus:outline-none"
                                                    >
                                                        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">{project.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold">({projectItems.length})</span>
                                                    </button>
                                                    {!isCollapsed && (
                                                        <div className="space-y-2 pl-1">
                                                            {projectItems.map(item => (
                                                                renderItem(item)
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredItems.map(item => (
                                            renderItem(item)
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer & Supplier Subtotals */}
                    {items.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-850 px-5 py-4 shrink-0 space-y-4">
                            {/* Supplier cost breakdown */}
                            {supplierBreakdowns.length > 1 && (
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5">
                                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest block">Distributor Subtotals (Ex VAT)</span>
                                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-gray-600 dark:text-gray-300">
                                        {supplierBreakdowns.map(sb => (
                                            <div key={sb.name} className="flex justify-between border-b border-gray-100/50 dark:border-gray-800/30 pb-0.5">
                                                <span className="truncate pr-1">{sb.name}</span>
                                                <span className="text-gray-900 dark:text-white tabular-nums">R {formatPrice(sb.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase tracking-wider">Subtotal (Ex VAT)</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-350 tabular-nums">R {formatPrice(totalExVat)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Total (Inc VAT)</span>
                                    </div>
                                    <span className="text-xl font-black text-orange-600 dark:text-orange-500 tabular-nums">R {formatPrice(totalIncVat)}</span>
                                </div>
                            </div>

                            <button
                                onClick={generateEmailTemplate}
                                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Generate Packages
                            </button>
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
