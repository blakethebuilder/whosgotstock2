'use client';

import React, { useState, useEffect } from 'react';
import DistributorImport from '../components/DistributorImport';

interface FetchLog {
    id: number;
    supplier_slug: string;
    supplier_name: string;
    started_at: string;
    finished_at: string | null;
    status: 'running' | 'success' | 'error';
    products_fetched: number;
    products_ingested: number;
    error_message: string | null;
    duration_seconds: number | null;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function formatDuration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return '—';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [authError, setAuthError] = useState('');

    const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'settings' | 'activity' | 'import' | 'resellers'>('overview');
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [supplierStats, setSupplierStats] = useState<any[]>([]);
    const [searchLogs, setSearchLogs] = useState<any[]>([]);
    const [quoteLogs, setQuoteLogs] = useState<any[]>([]);
    const [fetchLogs, setFetchLogs] = useState<FetchLog[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        update_interval_minutes: '60',
        public_markup: '15',
        team_markup: '10',
        management_markup: '5',
        admin_markup: '0'
    });
    const [loading, setLoading] = useState(true);

    // New User Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('public');
    const [newUserCompany, setNewUserCompany] = useState('');
    const [newUserFirstName, setNewUserFirstName] = useState('');
    const [newUserLastName, setNewUserLastName] = useState('');
    const [userFormError, setUserFormError] = useState('');
    const [userFormSuccess, setUserFormSuccess] = useState('');

    // New Supplier Form
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState('xml');

    // Expanded error rows in fetch logs
    const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

    const handleAuth = async () => {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passphrase, role: 'admin' })
            });

            const data = await response.json();
            if (data.success) {
                setIsAuthenticated(true);
                setAuthError('');
            } else {
                setAuthError('Invalid admin passphrase');
            }
        } catch (error) {
            setAuthError('Authentication failed');
        }
    };

    const refreshData = async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const [supRes, setRes, statsRes, logsRes, quoteRes, fetchRes, usersRes] = await Promise.all([
                fetch('/api/admin/suppliers').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/settings').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve({}) })),
                fetch('/api/admin/supplier-stats').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/search-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/quote-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/fetch-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/users').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve({ users: [] }) }))
            ]);

            let supData: any[] = [];
            let setData: any = {};

            if (supRes.ok) supData = await supRes.ok ? await supRes.json() : [];
            if (setRes.ok) setData = await setRes.ok ? await setRes.json() : {};

            let statsData: any[] = [];
            if (statsRes.ok) statsData = await statsRes.json();

            let logsData: any[] = [];
            if (logsRes.ok) logsData = await logsRes.json();

            let quotesData: any[] = [];
            if (quoteRes.ok) quotesData = await quoteRes.json();

            let fetchData: any[] = [];
            if (fetchRes.ok) fetchData = await fetchRes.json();

            let usersData: any = { users: [] };
            if (usersRes.ok) usersData = await usersRes.json();

            setSuppliers(Array.isArray(supData) ? supData : []);
            setSupplierStats(Array.isArray(statsData) ? statsData : []);
            setSearchLogs(Array.isArray(logsData) ? logsData : []);
            setQuoteLogs(Array.isArray(quotesData) ? quotesData : []);
            setFetchLogs(Array.isArray(fetchData) ? fetchData : []);
            setUsers(Array.isArray(usersData.users) ? usersData.users : []);
            setSettings({
                update_interval_minutes: (setData as any)?.update_interval_minutes || '60',
                public_markup: (setData as any)?.public_markup || '15',
                team_markup: (setData as any)?.team_markup || '10',
                management_markup: (setData as any)?.management_markup || '5',
                admin_markup: (setData as any)?.admin_markup || '0'
            });
        } catch (e) {
            console.error('Error fetching data:', e);
            setSuppliers([]);
            setSupplierStats([]);
            setFetchLogs([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserFormError('');
        setUserFormSuccess('');

        if (!newUserEmail || !newUserPassword) {
            setUserFormError('Email and Password are required.');
            return;
        }

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    role: newUserRole,
                    company_name: newUserCompany,
                    first_name: newUserFirstName,
                    last_name: newUserLastName
                })
            });

            const data = await res.json();
            if (res.ok) {
                setUserFormSuccess(`User ${newUserEmail} created successfully.`);
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserCompany('');
                setNewUserFirstName('');
                setNewUserLastName('');
                setNewUserRole('public');
                refreshData(true);
            } else {
                setUserFormError(data.error || 'Failed to create user.');
            }
        } catch (err) {
            setUserFormError('An error occurred during user creation.');
        }
    };

    const handleDeleteUser = async (id: number, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                refreshData(true);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user.');
            }
        } catch (err) {
            alert('An error occurred while deleting the user.');
        }
    };

    const handleUpdateSettings = async () => {
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert('Settings updated successfully');
            refreshData();
        } catch (error) {
            alert('Failed to update settings');
        }
    };

    const handleToggleSupplier = async (id: number) => {
        try {
            const supplier = suppliers.find(s => s.id === id);
            await fetch('/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle',
                    id,
                    enabled: !supplier?.enabled
                })
            });
            refreshData();
        } catch (error) {
            alert('Failed to toggle supplier');
        }
    };

    const handleDeleteSupplier = async (id: number) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;

        try {
            await fetch('/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
            refreshData();
        } catch (error) {
            alert('Failed to delete supplier');
        }
    };

    const handleAddSupplier = async () => {
        if (!newName || !newSlug || !newUrl) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await fetch('/api/admin/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    name: newName,
                    slug: newSlug,
                    url: newUrl,
                    type: newType
                })
            });
            setNewName('');
            setNewSlug('');
            setNewUrl('');
            setNewType('xml');
            refreshData();
        } catch (error) {
            alert('Failed to add supplier');
        }
    };

    const lastFetchBySupplier = (() => {
        const map: Record<string, FetchLog> = {};
        for (const log of fetchLogs) {
            if (!map[log.supplier_slug]) {
                map[log.supplier_slug] = log;
            }
        }
        return map;
    })();

    const toggleError = (id: number) => {
        setExpandedErrors(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
            const interval = setInterval(() => {
                refreshData(true);
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F3F4F1] dark:bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* Visual Ornaments */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-md w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white dark:border-gray-800 relative z-10 transition-all duration-300">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 bg-orange-500/10 rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Control Center</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">Verify administrator credentials</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                placeholder="Admin access code"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white text-base placeholder-gray-400 focus:outline-none transition-all"
                                autoFocus
                                autoComplete="off"
                            />
                        </div>

                        {authError && (
                            <div className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-950/20 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50 animate-shake">{authError}</div>
                        )}

                        <button
                            onClick={handleAuth}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gray-200 dark:shadow-none"
                        >
                            Authorize Access
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F4F1] dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Synthesizing telemetry data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F4F1] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans pb-16">
            {/* Control Bar */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-[100] transition-colors">
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">Control Center</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">WhosGotStock Orchestrator</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="/"
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Back to Search
                        </a>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Lock Console
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Horizontal Navigation Tabs */}
                <div className="flex bg-white dark:bg-gray-900 rounded-[2rem] p-2 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/40 dark:shadow-none mb-8 overflow-x-auto gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'suppliers', label: 'Supplier Integrations', icon: '🚚' },
                        { id: 'settings', label: 'System Settings', icon: '⚙️' },
                        { id: 'activity', label: 'Activity Logs', icon: '📈' },
                        { id: 'import', label: 'Manual Import', icon: '📤' },
                        { id: 'resellers', label: 'Reseller Access', icon: '👤' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* TAB CONTENT: OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Summary Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-none flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items Sync</div>
                                    <h3 className="text-3xl font-black text-gray-950 dark:text-white tracking-tighter">
                                        {supplierStats.reduce((sum, s) => sum + s.total_products, 0).toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Across all feeds</p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-none flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Suppliers</div>
                                    <h3 className="text-3xl font-black text-green-600 tracking-tighter">
                                        {suppliers.filter(s => s.enabled).length} / {suppliers.length}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-[10px] mt-4 font-bold uppercase tracking-widest">Live integrations</p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-none flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Searches (Month)</div>
                                    <h3 className="text-3xl font-black text-orange-600 tracking-tighter">
                                        {searchLogs.length.toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-[10px] mt-4 font-bold uppercase tracking-widest">API traffic</p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-white dark:border-gray-800 shadow-xl shadow-gray-200/30 dark:shadow-none flex flex-col justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quotes Built</div>
                                    <h3 className="text-3xl font-black text-blue-600 tracking-tighter">
                                        {quoteLogs.length.toLocaleString()}
                                    </h3>
                                </div>
                                <p className="text-gray-400 text-[10px] mt-4 font-bold uppercase tracking-widest">MSPs Conversions</p>
                            </div>
                        </div>

                        {/* Recent Feeds Health Grid */}
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl shadow-gray-200/40 dark:shadow-none">
                            <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tighter mb-2">Ingestion Diagnostics</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Real-time status of backend scraper plugins</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                                {suppliers.map(s => {
                                    const log = lastFetchBySupplier[s.slug];
                                    const status = log ? log.status : 'never';
                                    return (
                                        <div key={s.slug} className={`p-4 rounded-[2rem] border transition-all relative group cursor-help ${
                                            status === 'success' ? 'bg-green-500/5 border-green-200/50 dark:border-green-950/50' : 
                                            status === 'error' ? 'bg-red-500/5 border-red-200/50 dark:border-red-950/50' : 
                                            'bg-gray-500/5 border-gray-200 dark:border-gray-800'
                                        }`}>
                                            <div className="text-sm font-black text-gray-900 dark:text-white truncate">{s.name}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{s.type}</div>
                                            
                                            <div className="mt-4 flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${
                                                    status === 'success' ? 'bg-green-500' :
                                                    status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                                                }`}></span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                                            </div>
                                            {log && (
                                                <div className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    {timeAgo(log.started_at)}
                                                </div>
                                            )}
                                            
                                            {/* Premium Tooltip */}
                                            <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-900 text-white text-[11px] p-4 rounded-2xl shadow-2xl border border-slate-800 w-64 pointer-events-none bottom-[105%] left-1/2 -translate-x-1/2 mb-2">
                                                <div className="font-bold text-slate-200 mb-2 border-b border-slate-800 pb-1 flex justify-between items-center">
                                                    <span>Telemetry Run Details</span>
                                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{s.type}</span>
                                                </div>
                                                {log ? (
                                                    <div className="space-y-1.5 font-medium text-left text-slate-300">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-450">Duration:</span>
                                                            <span className="text-slate-100 font-bold">{formatDuration(log.duration_seconds)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-450">Fetched:</span>
                                                            <span className="text-slate-100 font-bold">{(log.products_fetched || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-450">Ingested:</span>
                                                            <span className="text-green-400 font-bold">{(log.products_ingested || 0).toLocaleString()}</span>
                                                        </div>
                                                        {log.error_message && (
                                                            <div className="mt-2 text-red-400 text-[10px] font-mono line-clamp-3 leading-relaxed border-t border-slate-800 pt-1.5 text-left">
                                                                {log.error_message}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-450 italic">No telemetry data recorded.</span>
                                                )}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary Metrics Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Supplier Stock Stats */}
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-4">Stock Statistics</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                        <thead>
                                            <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                <th className="pb-3">Supplier</th>
                                                <th className="pb-3">Total Items</th>
                                                <th className="pb-3">In Stock</th>
                                                <th className="pb-3">Last Synced</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                            {supplierStats.map((stat) => (
                                                <tr key={stat.supplier_slug} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                    <td className="py-3 font-black text-gray-900 dark:text-white">{stat.supplier_name}</td>
                                                    <td className="py-3 text-gray-600 dark:text-gray-400 font-bold">{stat.total_products.toLocaleString()}</td>
                                                    <td className="py-3 text-green-600 font-bold">{stat.products_in_stock.toLocaleString()}</td>
                                                    <td className="py-3 text-gray-500 font-semibold">{stat.last_updated ? new Date(stat.last_updated).toLocaleDateString() : 'Never'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Fetch summary overview */}
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-4">Latest Ingestion Runs</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                        <thead>
                                            <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                                <th className="pb-3">Supplier</th>
                                                <th className="pb-3">Fetched</th>
                                                <th className="pb-3">Ingested</th>
                                                <th className="pb-3">Duration</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                            {fetchLogs.slice(0, 5).map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                    <td className="py-3 font-black text-gray-900 dark:text-white">{log.supplier_name}</td>
                                                    <td className="py-3 text-gray-650 dark:text-gray-400">{(log.products_fetched || 0).toLocaleString()}</td>
                                                    <td className="py-3 text-green-600 font-bold">{(log.products_ingested || 0).toLocaleString()}</td>
                                                    <td className="py-3 text-gray-500">{formatDuration(log.duration_seconds)}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                                                            log.status === 'success' ? 'bg-green-500/10 text-green-600' :
                                                            log.status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: SUPPLIERS */}
                {activeTab === 'suppliers' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Supplier management list & form */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Add New Supplier */}
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl h-fit">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Add Integration</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Wire up a new supplier feed</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. MySupplier"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Supplier Slug</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. mysupplier"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Feed URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://api.supplier.co.za/feed"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Format Type</label>
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white focus:outline-none"
                                        >
                                            <option value="xml">XML Document Feed</option>
                                            <option value="csv">CSV File Feed</option>
                                            <option value="json">JSON API endpoint</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddSupplier}
                                        className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md"
                                    >
                                        Add Supplier
                                    </button>
                                </div>
                            </div>

                            {/* Right: Active suppliers list */}
                            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Registered Suppliers</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Manage live connections</p>
                                
                                <div className="space-y-4">
                                    {suppliers.map(s => (
                                        <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/40 rounded-[2rem] border border-gray-100 dark:border-gray-800 gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{s.name}</h3>
                                                    <span className="px-2.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-widest rounded-lg">{s.type}</span>
                                                    <span className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                </div>
                                                <p className="text-xs text-gray-400 truncate mt-1 select-all font-mono" title={s.url}>{s.url}</p>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleToggleSupplier(s.id)}
                                                    className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                                                        s.enabled 
                                                            ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100' 
                                                            : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {s.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(s.id)}
                                                    className="px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Ingestion Fetch History logs */}
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Detailed Ingestion History</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Historical trace log of scraper runs</p>
                                </div>
                                <button
                                    onClick={() => refreshData(false)}
                                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border border-gray-150 dark:border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Refresh Logs
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                            <th className="pb-3 px-3">Supplier</th>
                                            <th className="pb-3 px-3">Started</th>
                                            <th className="pb-3 px-3">Duration</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3 text-right">Fetched</th>
                                            <th className="pb-3 px-3 text-right">Ingested</th>
                                            <th className="pb-3 px-3 text-right">Diagnostics</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                        {fetchLogs.map((log) => (
                                            <React.Fragment key={log.id}>
                                                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                    <td className="py-3.5 px-3 font-black text-gray-900 dark:text-white">{log.supplier_name}</td>
                                                    <td className="py-3.5 px-3 text-gray-500">
                                                        <span>{timeAgo(log.started_at)}</span>
                                                        <span className="text-[9px] text-gray-400/80 block">{new Date(log.started_at).toLocaleTimeString()}</span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-gray-500">{formatDuration(log.duration_seconds)}</td>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                                                            log.status === 'success' ? 'bg-green-500/10 text-green-600' :
                                                            log.status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-600'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right text-gray-600 dark:text-gray-450 font-bold">{(log.products_fetched || 0).toLocaleString()}</td>
                                                    <td className="py-3.5 px-3 text-right text-green-600 font-extrabold">{(log.products_ingested || 0).toLocaleString()}</td>
                                                    <td className="py-3.5 px-3 text-right">
                                                        {log.error_message ? (
                                                            <button
                                                                onClick={() => toggleError(log.id)}
                                                                className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                            >
                                                                {expandedErrors.has(log.id) ? 'Hide' : 'Inspect ⚠'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-300 dark:text-gray-700">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {/* Expanded Error block */}
                                                {log.error_message && expandedErrors.has(log.id) && (
                                                    <tr className="bg-red-50/50 dark:bg-red-950/5">
                                                        <td colSpan={7} className="px-4 py-3 border-l-2 border-red-500">
                                                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Trace Log Error:</div>
                                                            <pre className="text-xs text-red-700 dark:text-red-400 font-mono whitespace-pre-wrap">{log.error_message}</pre>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        {fetchLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-400 italic font-semibold">No fetch log histories recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                        {/* Settings & Access markup */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Access Tier Markups */}
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Pricing Markups</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Manage markups applied by access role</p>

                                <div className="space-y-4">
                                    {[
                                        { key: 'team_markup', label: 'Team Tier Markup', color: 'text-blue-500 bg-blue-500/10', editable: true }
                                    ].map(markup => (
                                        <div key={markup.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg ${markup.color}`}>{markup.label.split(' ')[0]}</span>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{markup.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={(settings as any)[markup.key]}
                                                    onChange={(e) => setSettings({ ...settings, [markup.key]: e.target.value })}
                                                    className="w-20 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white text-center focus:outline-none"
                                                />
                                                <span className="text-sm font-bold">%</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-850/50 rounded-2xl border border-gray-100 dark:border-gray-800/80 opacity-70">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg text-purple-500 bg-purple-500/10">Reseller</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Reseller Tier Markup</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-400 bg-gray-200/50 dark:bg-gray-800 px-3 py-1.5 rounded-xl">Fixed 0%</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-850/50 rounded-2xl border border-gray-100 dark:border-gray-800/80 opacity-70">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg text-green-500 bg-green-500/10">Admin</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin/Partner Tier Markup</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-400 bg-gray-200/50 dark:bg-gray-800 px-3 py-1.5 rounded-xl">Fixed 0%</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleUpdateSettings}
                                        className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
                                    >
                                        Update access level markups
                                    </button>
                                </div>
                            </div>

                            {/* System Configurations */}
                            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">System Configurations</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Tweak global settings parameters</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Automated Update Interval (minutes)</label>
                                        <input
                                            type="number"
                                            value={settings.update_interval_minutes}
                                            onChange={(e) => setSettings({ ...settings, update_interval_minutes: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 text-sm font-bold text-gray-900 dark:text-white focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdateSettings}
                                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
                                    >
                                        Save configuration parameters
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right sidebar: DB Setup, pricing previews */}
                        <div className="space-y-6">
                            {/* Maintenance schema setup */}
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border-2 border-red-500/10 dark:border-red-500/20 shadow-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-500 font-black">⚠</span>
                                    <h2 className="text-md font-black text-gray-900 dark:text-white tracking-tighter">Database Maintenance</h2>
                                </div>
                                <p className="text-xs text-gray-400 font-semibold mb-4 leading-relaxed">Initialize database tables, rebuild trigram indexes, repair missing schemas, and fix Linkqage S3 image paths in your DB.</p>
                                <button
                                    onClick={async () => {
                                        if (!confirm("Rebuild database schemas, setup missing indexes, and apply relative image repairs?")) return;
                                        try {
                                            const res = await fetch('/api/admin/setup-db', { method: 'POST' });
                                            const data = await res.json();
                                            if (data.success) alert("Database maintenance finished successfully!");
                                            else alert("Error: " + data.error);
                                        } catch (e) {
                                            alert("Request connection failed");
                                        }
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                                >
                                    Rebuild/Repair DB
                                </button>
                            </div>

                            {/* Pricing preview widget */}
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-white dark:border-gray-800 shadow-2xl">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Pricing Preview Model</h3>
                                <p className="text-[10px] text-gray-400 font-bold mb-4 uppercase tracking-widest">Sample: R1,000 baseline price</p>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-center p-2.5 bg-red-500/5 rounded-xl">
                                        <span className="text-red-650 dark:text-red-400 font-black">Public Portal Price:</span>
                                        <span className="font-black text-orange-500">Hidden (Prices Hidden)</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-blue-500/5 rounded-xl">
                                        <span className="text-blue-650 dark:text-blue-400 font-black">Team Price:</span>
                                        <span className="font-black text-gray-900 dark:text-white">R {(1000 * (1 + parseInt(settings.team_markup || '10') / 100)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-purple-500/5 rounded-xl">
                                        <span className="text-purple-650 dark:text-purple-400 font-black">Reseller Price:</span>
                                        <span className="font-black text-gray-900 dark:text-white">R 1000.00</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-green-500/5 rounded-xl">
                                        <span className="text-green-650 dark:text-green-400 font-black">Admin Cost Price:</span>
                                        <span className="font-black text-gray-900 dark:text-white">R 1000.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: ACTIVITY */}
                {activeTab === 'activity' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                        {/* Searches */}
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Search Analytics</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Audit trace logs of MSP searches</p>
                            
                            <div className="overflow-y-auto max-h-[600px]">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                            <th className="pb-3 px-2">Time</th>
                                            <th className="pb-3 px-2">Query String</th>
                                            <th className="pb-3 px-2 text-right">Items Found</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                        {searchLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                <td className="py-3 px-2 text-[10px] text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="py-3 px-2 font-bold text-gray-900 dark:text-white select-all">{log.query || <span className="italic text-gray-300">Explored Feed</span>}</td>
                                                <td className="py-3 px-2 text-right text-orange-600 font-extrabold">{log.results_count.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {searchLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-gray-400 italic">No search entries logged.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quote activity */}
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Quote Invoices Generated</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Audit logs of PDF client exports</p>
                            
                            <div className="overflow-y-auto max-h-[600px]">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                                    <thead>
                                        <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                            <th className="pb-3 px-2">Time</th>
                                            <th className="pb-3 px-2">Role</th>
                                            <th className="pb-3 px-2">Items Count</th>
                                            <th className="pb-3 px-2 text-right">Total (Incl VAT)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                        {quoteLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                <td className="py-3 px-2 text-[10px] text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${log.user_role === 'admin' ? 'bg-green-50 text-green-600 border-green-100' :
                                                            log.user_role === 'reseller' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                log.user_role === 'team' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-gray-50 text-gray-650 border-gray-100'
                                                        }`}>
                                                        {log.user_role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-gray-900 dark:text-white font-bold">{log.items?.length || 0} Products</td>
                                                <td className="py-3 px-2 text-right text-orange-600 font-extrabold">R {parseFloat(log.total_inc_vat).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                        {quoteLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">No quote templates generated.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: IMPORT */}
                {activeTab === 'import' && (
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 border border-white dark:border-gray-800 shadow-2xl max-w-4xl mx-auto animate-in fade-in duration-500">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-gray-950 dark:text-white tracking-tighter mb-1">Upload Product Lists</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Import custom pricing catalogs manually (Excel/CSV)</p>
                        </div>
                        <DistributorImport />
                    </div>
                )}

                {/* TAB CONTENT: RESELLERS & USER ACCOUNTS */}
                {activeTab === 'resellers' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                        {/* Create User Form Tile */}
                        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 border border-white dark:border-gray-800 shadow-xl">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-gray-955 dark:text-white tracking-tighter leading-none mb-1">Create Reseller / Account</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Add new verified resellers or system access roles</p>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                {userFormError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/40">
                                        ⚠️ {userFormError}
                                    </div>
                                )}
                                {userFormSuccess && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                                        ✅ {userFormSuccess}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={newUserFirstName}
                                            onChange={e => setNewUserFirstName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:text-white"
                                            placeholder="e.g. John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={newUserLastName}
                                            onChange={e => setNewUserLastName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:text-white"
                                            placeholder="e.g. Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">Company / Reseller Name</label>
                                    <input
                                        type="text"
                                        value={newUserCompany}
                                        onChange={e => setNewUserCompany(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:text-white"
                                        placeholder="e.g. Smart Reseller Ltd"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={newUserEmail}
                                        onChange={e => setNewUserEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:text-white"
                                        placeholder="e.g. partner@reseller.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">Passphrase / Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newUserPassword}
                                        onChange={e => setNewUserPassword(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 dark:text-white"
                                        placeholder="Password (min 8 chars)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-gray-450 tracking-wider mb-1">Access Role / Tier</label>
                                    <select
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-orange-500 dark:text-white cursor-pointer"
                                    >
                                        <option value="public">Free / Public Tier (pricing hidden)</option>
                                        <option value="team">Team Tier (controlled markup)</option>
                                        <option value="reseller">Reseller Tier (fixed 0% markup)</option>
                                        <option value="admin">System Administrator</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                                >
                                    Create Account
                                </button>
                            </form>
                        </div>

                        {/* User List Matrix Tile */}
                        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 sm:p-8 border border-white dark:border-gray-800 shadow-xl flex flex-col h-full">
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-gray-955 dark:text-white tracking-tighter leading-none mb-1">Registered Resellers</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active reseller profiles ({users.length} accounts)</p>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-805">
                                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-gray-450">Reseller Details</th>
                                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-gray-450">Company</th>
                                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-gray-450">Role Tier</th>
                                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-gray-450 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-black uppercase text-gray-600 dark:text-gray-300">
                                                            {u.first_name ? u.first_name.charAt(0) : u.email.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">
                                                                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Unknown Name'}
                                                            </p>
                                                            <p className="text-[9px] text-gray-405 mt-0.5">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                        {u.company_name || 'Individual Reseller'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                                                        u.role === 'admin' 
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                                            : u.role === 'reseller'
                                                                ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20'
                                                                : u.role === 'team'
                                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1.5 rounded-lg transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 italic">No registered user accounts found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
