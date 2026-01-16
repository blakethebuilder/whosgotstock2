import { useState, useEffect } from 'react';
import OrderModal from './OrderModal';
import { CartItem, UserRole, Project } from '../types';
import { calculatePrice, formatPrice, PricingSettings } from '@/lib/pricing';

type QuoteDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    projects: Project[];
    addProject: (name: string) => string;
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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Calculate totals using centralized pricing utility
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
            addProject(newProjectName.trim());
            setNewProjectName('');
            setShowProjectAdd(false);
        }
    };

    const generateEmailTemplate = () => {
        // Log the quote generation
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

    const renderItem = (item: CartItem) => (
        <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-black">{item.brand} • {item.supplier_name}</p>

                <div className="flex items-center gap-2 mb-3">
                    <select
                        value={item.projectId || ''}
                        onChange={(e) => updateItemProject(item.id, e.target.value || undefined)}
                        className="text-[10px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500 w-full"
                    >
                        <option value="">No Project (General)</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-orange-600 font-bold"
                        >
                            -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-orange-600 font-bold"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-orange-600">R {formatPrice(calculatePrice(item.price_ex_vat, userRole, pricingSettings).exVat)}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Ex VAT</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[200] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter italic">Quote Builder</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {!showProjectAdd ? (
                            <button
                                onClick={() => setShowProjectAdd(true)}
                                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-500 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Create New Project / Site
                            </button>
                        ) : (
                            <form onSubmit={handleAddProject} className="space-y-3">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Project Name (e.g. Site B / Client X)"
                                    className="w-full p-3 bg-white border-2 border-orange-500 rounded-xl text-sm font-bold focus:outline-none"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase tracking-widest">Create</button>
                                    <button type="button" onClick={() => setShowProjectAdd(false)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="p-6 bg-white rounded-3xl shadow-xl shadow-gray-200/50">
                                    <svg className="w-12 h-12 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <p className="text-gray-900 font-black text-lg tracking-tighter italic">Your bag is empty.</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Start searching for hardware</p>
                            </div>
                        ) : (
                            <>
                                {/* General Items (No Project) */}
                                {items.filter(i => !i.projectId).length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-gray-200" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">General Items</span>
                                            <div className="h-px flex-1 bg-gray-200" />
                                        </div>
                                        <div className="space-y-4">
                                            {items.filter(i => !i.projectId).map(renderItem)}
                                        </div>
                                    </div>
                                )}

                                {/* Project Grouped Items */}
                                {projects.map(project => {
                                    const projectItems = items.filter(i => i.projectId === project.id);
                                    if (projectItems.length === 0) return null;

                                    return (
                                        <div key={project.id} className="space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                    <span className="text-sm font-black text-gray-900 tracking-tighter uppercase">{project.name}</span>
                                                </div>
                                                <button onClick={() => removeProject(project.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">Delete Project</button>
                                            </div>
                                            <div className="space-y-4">
                                                {projectItems.map(renderItem)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                        <div className="p-6 border-t border-gray-100 space-y-4 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Subtotal (Ex VAT)</span>
                                    <span>R {formatPrice(totalExVat)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Quote Total</span>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-gray-900 tracking-tighter italic">R {formatPrice(totalIncVat)}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inc. VAT</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={generateEmailTemplate}
                                className="w-full bg-gray-900 hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                            >
                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Generate Detailed Quote
                            </button>
                            <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-[0.2em]">
                                Breakdown by project & site fully supported
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
