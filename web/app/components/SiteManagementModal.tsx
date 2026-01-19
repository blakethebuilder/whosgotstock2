'use client';

import { useState } from 'react';
import { Project } from '../types';

type SiteManagementModalProps = {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    addProject: (name: string, slug?: string) => string | null;
    removeProject: (id: string) => void;
    updateProject: (id: string, name: string, slug?: string) => void;
}

export default function SiteManagementModal({
    isOpen,
    onClose,
    projects,
    addProject,
    removeProject,
    updateProject
}: SiteManagementModalProps) {
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectSlug, setNewProjectSlug] = useState('');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');

    if (!isOpen) return null;

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            const result = addProject(newProjectName.trim(), newProjectSlug.trim() || undefined);
            if (result) {
                setNewProjectName('');
                setNewProjectSlug('');
            }
        }
    };

    const handleUpdateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject && editName.trim()) {
            updateProject(editingProject.id, editName.trim(), editSlug.trim() || undefined);
            setEditingProject(null);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Site Management</h2>
                        <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold">Organize Your Projects & Locations</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all active:scale-90">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Add New Site Form */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Site
                        </h3>
                        <form onSubmit={handleAddProject} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Site Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Building A, Head Office, Warehouse"
                                    className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 transition-all"
                                    value={newProjectName}
                                    onChange={(e) => {
                                        setNewProjectName(e.target.value);
                                        if (!newProjectSlug || newProjectSlug === editingProject?.slug) {
                                            setNewProjectSlug(generateSlug(e.target.value));
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Site Slug (for emails)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g., building-a, head-office"
                                        className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 transition-all"
                                        value={newProjectSlug}
                                        onChange={(e) => setNewProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewProjectSlug(generateSlug(newProjectName))}
                                        className="bg-gray-200 text-gray-700 px-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-300 transition-colors"
                                    >
                                        Auto-Generate
                                    </button>
                                </div>
                                <p className="text-[9px] text-gray-400 mt-1 italic">Used in email templates as {`{Site_Slug}`}. Example: quote-building-a.pdf</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-orange-600 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
                            >
                                Add Site
                            </button>
                        </form>
                    </div>

                    {/* Existing Sites */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Your Sites ({projects.length}/3)
                            </h3>
                        </div>

                        {projects.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p className="text-gray-400 text-sm italic">No sites created yet. Add sites to organize hardware for specific locations.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {projects.map(p => (
                                    <div key={p.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-all">
                                        {editingProject?.id === p.id ? (
                                            <form onSubmit={handleUpdateProject} className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-50 border border-orange-500 rounded-xl px-3 py-2 text-sm font-bold"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs"
                                                        value={editSlug}
                                                        onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                        placeholder="site-slug"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditSlug(generateSlug(editName))}
                                                        className="bg-gray-200 text-xs px-2 rounded text-gray-600"
                                                    >
                                                        Auto
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-orange-600 text-white px-4 py-1 rounded text-xs font-black"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingProject(null)}
                                                        className="bg-gray-200 text-gray-600 px-4 py-1 rounded text-xs font-black"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm">
                                                            {p.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-gray-900 text-sm uppercase tracking-tighter">{p.name}</h4>
                                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Slug: {p.slug || 'Not Set'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-auto">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(p);
                                                            setEditName(p.name);
                                                            setEditSlug(p.slug || generateSlug(p.name));
                                                        }}
                                                        className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"
                                                        title="Edit Site"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => removeProject(p.id)}
                                                        className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                                        title="Delete Site"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="w-full px-10 py-4 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"
                    >
                        Close Site Manager
                    </button>
                </div>
            </div>
        </div>
    );
}