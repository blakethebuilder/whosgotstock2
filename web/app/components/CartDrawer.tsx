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
    const [newProjectName, setNewProjectName] = useState('');
    const [showProjectAdd, setShowProjectAdd] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setActiveTab('all');
            setSearchQuery('');
            setCollapsedSections(new Set());
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

    const renderItem = (item: CartItem) => {
        const itemPrice = calculatePrice(item.price_ex_vat, userRole, pricingSettings);
        const lineTotal = parseFloat(itemPrice.exVat) * item.quantity;

        return (
            <div key={item.id} className="group flex flex-col gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-orange-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.brand} • {item.supplier_name}</p>
                    </div>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100">
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white rounded-l-lg transition-all text-sm font-medium"
                        >
                            −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-gray-900 tabular-nums">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white rounded-r-lg transition-all text-sm font-medium"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-right min-w-[70px]">
                        <p className="text-xs font-semibold text-gray-900 tabular-nums">R {formatPrice(lineTotal)}</p>
                        <p className="text-[9px] text-gray-400">R {formatPrice(parseFloat(itemPrice.exVat))} ea</p>
                    </div>
                </div>

                {projects.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <select
                            value={item.projectId || ''}
                            onChange={(e) => updateItemProject(item.id, e.target.value || undefined)}
                            className="flex-1 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-orange-400 cursor-pointer"
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

            <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl z-[200] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-5 py-4 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Quote Builder</h2>
                                <p className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Sites */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">Sites / Projects</span>
                                {projects.length < 3 && !showProjectAdd && (
                                    <button
                                        onClick={() => setShowProjectAdd(true)}
                                        className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        Add Site
                                    </button>
                                )}
                            </div>

                            {showProjectAdd ? (
                                <form onSubmit={handleAddProject} className="flex gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Site name..."
                                        className="flex-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                    />
                                    <button type="submit" className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors">Add</button>
                                    <button type="button" onClick={() => setShowProjectAdd(false)} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                                </form>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {projects.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No sites yet</p>
                                    ) : (
                                        projects.map(p => (
                                            <div key={p.id} className="group flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1">
                                                <span className="text-xs font-medium text-gray-700">{p.name}</span>
                                                <span className="text-[10px] text-gray-400">({getProjectItemCount(p.id)})</span>
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
                        <div className="bg-white border-b border-gray-100 px-5 py-3 shrink-0 space-y-3">
                            {items.length > 3 && (
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
                                    />
                                </div>
                            )}

                            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <span className="truncate max-w-[100px]">{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                            activeTab === tab.id ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-400'
                                        }`}>{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                <p className="text-sm font-medium">No items yet</p>
                                <p className="text-xs mt-1">Add items from search to build your quote</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No items match your search</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'all' ? (
                                    <>
                                        {unassignedCount > 0 && (
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => toggleSection('unassigned')}
                                                    className="flex items-center gap-2 w-full text-left"
                                                >
                                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsedSections.has('unassigned') ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    <span className="text-xs font-semibold text-gray-600">Main Quote</span>
                                                    <span className="text-[10px] text-gray-400">({unassignedCount})</span>
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
                                                        className="flex items-center gap-2 w-full text-left"
                                                    >
                                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        <span className="text-xs font-semibold text-gray-600">{project.name}</span>
                                                        <span className="text-[10px] text-gray-400">({projectItems.length})</span>
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

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="bg-white border-t border-gray-100 px-5 py-4 shrink-0 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Subtotal (ex VAT)</span>
                                <span className="text-sm font-semibold tabular-nums">R {formatPrice(totalExVat)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">Total (inc VAT)</span>
                                </div>
                                <span className="text-xl font-bold tabular-nums">R {formatPrice(totalIncVat)}</span>
                            </div>

                            <button
                                onClick={generateEmailTemplate}
                                className="w-full bg-gray-900 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Generate Site Packages
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
