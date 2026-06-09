'use client';

import { useState, useEffect } from 'react';
import DistributorImport from '../components/DistributorImport';
import AdminPanel from '../components/admin/AdminPanel';

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

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [supplierStats, setSupplierStats] = useState<any[]>([]);
    const [searchLogs, setSearchLogs] = useState<any[]>([]);
    const [quoteLogs, setQuoteLogs] = useState<any[]>([]);
    const [fetchLogs, setFetchLogs] = useState<FetchLog[]>([]);
    const [settings, setSettings] = useState({
        update_interval_minutes: '60',
        public_markup: '15',
        team_markup: '10',
        management_markup: '5',
        admin_markup: '0'
    });
    const [loading, setLoading] = useState(true);

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

    const refreshData = async () => {
        setLoading(true);
        try {
            const [supRes, setRes, statsRes, logsRes, quoteRes, fetchRes] = await Promise.all([
                fetch('/api/admin/suppliers').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/settings').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve({}) })),
                fetch('/api/admin/supplier-stats').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/search-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/quote-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) })),
                fetch('/api/admin/fetch-logs').catch(e => ({ ok: false, status: 500, json: () => Promise.resolve([]) }))
            ]);

            let supData: any[] = [];
            let setData: any = {};

            if (supRes.ok) supData = await supRes.json();
            if (setRes.ok) setData = await setRes.json();

            let statsData: any[] = [];
            if (statsRes.ok) statsData = await statsRes.json();

            let logsData: any[] = [];
            if (logsRes.ok) logsData = await logsRes.json();

            let quotesData: any[] = [];
            if (quoteRes.ok) quotesData = await quoteRes.json();

            let fetchData: any[] = [];
            if (fetchRes.ok) fetchData = await fetchRes.json();

            setSuppliers(Array.isArray(supData) ? supData : []);
            setSupplierStats(Array.isArray(statsData) ? statsData : []);
            setSearchLogs(Array.isArray(logsData) ? logsData : []);
            setQuoteLogs(Array.isArray(quotesData) ? quotesData : []);
            setFetchLogs(Array.isArray(fetchData) ? fetchData : []);
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
            setSettings({
                update_interval_minutes: '60',
                public_markup: '15',
                team_markup: '10',
                management_markup: '5',
                admin_markup: '0'
            });
        } finally {
            setLoading(false);
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

    // Build "last fetch" summary per supplier from fetchLogs
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
        }
    }, [isAuthenticated]);

    // Authentication screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                        <p className="text-gray-600 mt-2">Enter admin passphrase to continue</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                placeholder="Admin passphrase"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                autoFocus
                                autoComplete="off"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck="false"
                                inputMode="text"
                            />
                        </div>

                        {authError && (
                            <div className="text-red-600 text-sm text-center">{authError}</div>
                        )}

                        <button
                            onClick={handleAuth}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                            Access Admin Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-2xl font-bold text-gray-900">WhosGotStock Admin Portal</h1>
                        <div className="flex items-center gap-4">
                            <a
                                href="/"
                                className="text-orange-600 hover:text-orange-700 font-medium"
                            >
                                Back to Search
                            </a>
                            <button
                                onClick={() => setIsAuthenticated(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Settings & Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* System Settings */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Update Interval (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.update_interval_minutes}
                                        onChange={(e) => setSettings({ ...settings, update_interval_minutes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>

                        {/* Database Maintenance */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-50">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Maintenance</h2>
                            <p className="text-xs text-gray-500 mb-4">Run database migrations and schema fixes.</p>
                            <button
                                onClick={async () => {
                                    if (!confirm("Initialize or fix database schema? This will ensure all columns exist.")) return;
                                    try {
                                        const res = await fetch('/api/admin/setup-db', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) alert("Database setup/fix complete!");
                                        else alert("Error: " + data.error);
                                    } catch (e) {
                                        alert("Connection failed");
                                    }
                                }}
                                className="w-full bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                Setup Database
                            </button>
                        </div>

                        {/* Internal Access Levels */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Access Levels</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-red-600">Public:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.public_markup}
                                            onChange={(e) => setSettings({ ...settings, public_markup: e.target.value })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-blue-600">Team:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.team_markup}
                                            onChange={(e) => setSettings({ ...settings, team_markup: e.target.value })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-purple-600">Management:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.management_markup}
                                            onChange={(e) => setSettings({ ...settings, management_markup: e.target.value })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-600">Admin:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.admin_markup}
                                            onChange={(e) => setSettings({ ...settings, admin_markup: e.target.value })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium mt-3"
                                >
                                    Update Access Levels
                                </button>
                            </div>
                        </div>

                        {/* Pricing Preview */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing Preview</h3>
                            <p className="text-xs text-gray-700 mb-3">Example: R1,000 base price</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-red-600 font-medium">Public:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.public_markup || '15') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-600 font-medium">Team:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.team_markup || '10') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-purple-600 font-medium">Management:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.management_markup || '5') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-medium">Admin:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.admin_markup || '0') / 100)).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Supplier Management */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Management</h2>
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Fetch</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {suppliers.map((supplier) => {
                                                const lastFetch = lastFetchBySupplier[supplier.slug];
                                                return (
                                                    <tr key={supplier.id}>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{supplier.name}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 uppercase">{supplier.type}</td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {supplier.enabled ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-gray-600">
                                                            {lastFetch ? (
                                                                <div>
                                                                    <span className={`inline-flex items-center gap-1 ${lastFetch.status === 'success' ? 'text-green-600' : lastFetch.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${lastFetch.status === 'success' ? 'bg-green-500' : lastFetch.status === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></span>
                                                                        {timeAgo(lastFetch.started_at)}
                                                                    </span>
                                                                    {lastFetch.products_ingested > 0 && (
                                                                        <span className="text-gray-400 ml-1">({lastFetch.products_ingested.toLocaleString()})</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Never</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleToggleSupplier(supplier.id);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    {supplier.enabled ? 'Disable' : 'Enable'}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleDeleteSupplier(supplier.id);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-700 font-medium"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add New Supplier */}
                                <div className="border-t pt-4">
                                    <h3 className="text-md font-medium text-gray-900 mb-3">Add New Supplier</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. MySupplier)"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Slug (e.g. mysupplier)"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-500"
                                        />
                                        <input
                                            type="url"
                                            placeholder="Feed URL"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-500"
                                        />
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                                        >
                                            <option value="xml">XML Feed</option>
                                            <option value="csv">CSV Feed</option>
                                            <option value="json">JSON API</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddSupplier();
                                        }}
                                        className="mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                                    >
                                        Add Supplier
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Fetch History — NEW */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Supplier Fetch History</h2>
                                    <p className="text-sm text-gray-500">Times and details of the last data fetches for each supplier</p>
                                </div>
                                <button
                                    onClick={refreshData}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Refresh
                                </button>
                            </div>

                            {/* Summary Cards — last fetch per supplier */}
                            {Object.keys(lastFetchBySupplier).length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                                    {Object.values(lastFetchBySupplier).map((log) => (
                                        <div key={log.supplier_slug} className={`p-3 rounded-lg border ${log.status === 'success' ? 'border-green-200 bg-green-50' : log.status === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                                            <div className="text-xs font-bold text-gray-900 truncate">{log.supplier_name}</div>
                                            <div className={`text-[10px] font-semibold mt-1 ${log.status === 'success' ? 'text-green-600' : log.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⟳'} {timeAgo(log.started_at)}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                {log.products_ingested > 0 ? `${log.products_ingested.toLocaleString()} products` : 'No data'}
                                            </div>
                                            {log.duration_seconds !== null && (
                                                <div className="text-[10px] text-gray-400">{formatDuration(log.duration_seconds)}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Full fetch log table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fetched</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingested</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {fetchLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 text-xs font-medium text-gray-900">{log.supplier_name}</td>
                                                <td className="px-3 py-2 text-[10px] text-gray-500" title={new Date(log.started_at).toLocaleString()}>
                                                    {timeAgo(log.started_at)}
                                                    <div className="text-[9px] text-gray-400">{new Date(log.started_at).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600">{formatDuration(log.duration_seconds)}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                                                        log.status === 'error' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-600 font-medium">{(log.products_fetched || 0).toLocaleString()}</td>
                                                <td className="px-3 py-2 text-xs text-green-600 font-bold">{(log.products_ingested || 0).toLocaleString()}</td>
                                                <td className="px-3 py-2 text-xs">
                                                    {log.error_message ? (
                                                        <button
                                                            onClick={() => toggleError(log.id)}
                                                            className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider"
                                                        >
                                                            {expandedErrors.has(log.id) ? 'Hide' : 'Error ⚠'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-[10px]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Expanded error rows */}
                                        {fetchLogs.filter(l => l.error_message && expandedErrors.has(l.id)).map(log => (
                                            <tr key={`err-${log.id}`} className="bg-red-50">
                                                <td colSpan={7} className="px-3 py-2 text-xs text-red-700 font-mono">
                                                    <strong>{log.supplier_name}:</strong> {log.error_message}
                                                </td>
                                            </tr>
                                        ))}
                                        {fetchLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                                                    No fetch history yet. Data will appear after the worker runs its first ingestion cycle.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Supplier Statistics */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Statistics</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {supplierStats.map((stat) => (
                                            <tr key={stat.supplier_slug}>
                                                <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate max-w-[120px]" title={stat.supplier_name}>
                                                    {stat.supplier_name}
                                                </td>
                                                <td className="px-2 py-2 text-xs text-gray-600 uppercase">{stat.supplier_type}</td>
                                                <td className="px-2 py-2">
                                                    <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${stat.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {stat.enabled ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 text-xs text-gray-900 font-medium">{stat.total_products.toLocaleString()}</td>
                                                <td className="px-2 py-2 text-xs text-green-600 font-medium">{stat.products_in_stock.toLocaleString()}</td>
                                                <td className="px-2 py-2 text-xs text-gray-600 truncate max-w-[100px]" title={stat.last_updated ? new Date(stat.last_updated).toLocaleString() : 'Never'}>
                                                    {stat.last_updated ? new Date(stat.last_updated).toLocaleDateString() : 'Never'}
                                                </td>
                                                <td className="px-2 py-2 text-xs text-gray-600">
                                                    {stat.min_price !== '0.00' ? `R${stat.min_price}-${stat.max_price}` : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                        {supplierStats.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-2 py-4 text-center text-xs text-gray-500">
                                                    No supplier statistics available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Search Logs */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Search Activity</h2>
                                <button
                                    onClick={refreshData}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Refresh logs
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filters Applied</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {searchLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-[10px]">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {log.query || <span className="text-gray-400 italic font-normal text-[10px]">Aggregated View</span>}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 font-bold">
                                                    {log.results_count.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.filters?.suppliers?.length > 0 && (
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black border border-blue-100 uppercase tracking-tighter">
                                                                {log.filters.suppliers.join(', ')}
                                                            </span>
                                                        )}
                                                        {log.filters?.categories?.length > 0 && (
                                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[9px] font-black border border-purple-100 uppercase tracking-tighter">
                                                                {log.filters.categories.length} Cat
                                                            </span>
                                                        )}
                                                        {log.filters?.brand && (
                                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-black border border-green-100 uppercase tracking-tighter">
                                                                {log.filters.brand}
                                                            </span>
                                                        )}
                                                        {(log.filters?.minPrice > 0 || log.filters?.maxPrice < 999999) && (
                                                            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-md text-[9px] font-black border border-yellow-100 uppercase tracking-tighter">
                                                                R{log.filters.minPrice}-R{log.filters.maxPrice}
                                                            </span>
                                                        )}
                                                        {!log.filters?.suppliers?.length && !log.filters?.categories?.length && !log.filters?.brand && log.filters?.minPrice === 0 && log.filters?.maxPrice === 999999 && (
                                                            <span className="text-gray-300 text-[9px] font-bold uppercase tracking-tighter">Clean Search</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {searchLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                                                    No search logs recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Quote Activity */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Quote Templates Generated</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Inc VAT)</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {quoteLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-[10px]">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ${log.user_role === 'admin' ? 'bg-green-50 text-green-600 border-green-100' :
                                                            log.user_role === 'management' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                log.user_role === 'team' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                        }`}>
                                                        {log.user_role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-900 font-medium">
                                                    {log.items?.length || 0} Products
                                                </td>
                                                <td className="px-4 py-3 text-orange-600 font-black">
                                                    R {parseFloat(log.total_inc_vat).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => alert(JSON.stringify(log.items, null, 2))}
                                                        className="text-[10px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {quoteLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                                    No quotes generated yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Manual Product Import */}
                        <DistributorImport />
                    </div>
                </div>
            </div>
        </div>
    );
}
