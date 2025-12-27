'use client';

import { useState, useEffect } from 'react';
import DistributorImport from '../components/DistributorImport';
// import LinkqageScraper from '../components/LinkqageScraper';
import GenericScraper from '../components/GenericScraper';

export default function AdminPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        update_interval_minutes: '60',
        guest_markup: '15',
        staff_markup: '10',
        manager_markup: '5',
        admin_markup: '0'
    });
    const [loading, setLoading] = useState(true);

    // New Supplier Form
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newType, setNewType] = useState('scoop');

    const refreshData = async () => {
        setLoading(true);
        try {
            const [supRes, setRes] = await Promise.all([
                fetch('/api/admin/suppliers'),
                fetch('/api/admin/settings')
            ]);
            const supData = await supRes.json();
            const setData = await setRes.json();
            setSuppliers(supData);
            setSettings(setData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleUpdateSettings = async () => {
        await fetch('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
        alert('Settings updated');
    };

    const handleToggle = async (id: number, current: boolean) => {
        await fetch('/api/admin/suppliers', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle', id, enabled: !current })
        });
        refreshData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete supplier?")) return;
        await fetch('/api/admin/suppliers', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id })
        });
        refreshData();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/admin/suppliers', {
            method: 'POST',
            body: JSON.stringify({ action: 'create', name: newName, slug: newSlug, url: newUrl, type: newType })
        });
        setNewName(''); setNewSlug(''); setNewUrl(''); setNewType('scoop');
        refreshData();
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <main className="min-h-screen p-8 bg-gray-50 text-gray-900">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Portal</h1>
                    <a href="/" className="text-blue-600 hover:underline">Back to Search</a>
                </div>

                {/* Settings Section */}
                <div className="bg-white p-6 rounded shadow mb-8">
                    <h2 className="text-xl font-semibold mb-4">System Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Update Interval (minutes):</label>
                            <input
                                type="number"
                                value={settings.update_interval_minutes}
                                onChange={e => setSettings({ ...settings, update_interval_minutes: e.target.value })}
                                className="border p-2 rounded w-full"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button onClick={handleUpdateSettings} className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition-colors w-full md:w-auto">
                                Save All Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Tiers Section */}
                <div className="bg-white p-6 rounded shadow mb-8">
                    <h2 className="text-xl font-semibold mb-4">Pricing Tiers Management</h2>
                    <p className="text-gray-600 mb-6">Control markup percentages for different user roles. Higher percentages mean higher prices for customers.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <label className="block text-sm font-semibold text-red-700">Guest/Public Markup (%):</label>
                            </div>
                            <input
                                type="number"
                                value={settings.guest_markup}
                                onChange={e => setSettings({ ...settings, guest_markup: e.target.value })}
                                className="border p-2 rounded w-full"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-red-600 mt-1">Highest pricing tier</p>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <label className="block text-sm font-semibold text-orange-700">Staff Markup (%):</label>
                            </div>
                            <input
                                type="number"
                                value={settings.staff_markup}
                                onChange={e => setSettings({ ...settings, staff_markup: e.target.value })}
                                className="border p-2 rounded w-full"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-orange-600 mt-1">Shows discount vs Guest</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <label className="block text-sm font-semibold text-blue-700">Manager Markup (%):</label>
                            </div>
                            <input
                                type="number"
                                value={settings.manager_markup}
                                onChange={e => setSettings({ ...settings, manager_markup: e.target.value })}
                                className="border p-2 rounded w-full"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-blue-600 mt-1">Better discount vs Guest</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <label className="block text-sm font-semibold text-green-700">Admin Markup (%):</label>
                            </div>
                            <input
                                type="number"
                                value={settings.admin_markup}
                                onChange={e => setSettings({ ...settings, admin_markup: e.target.value })}
                                className="border p-2 rounded w-full"
                                min="0"
                                max="100"
                            />
                            <p className="text-xs text-green-600 mt-1">Cost price access</p>
                        </div>
                    </div>

                    {/* Pricing Preview */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-3">Pricing Preview (Example: R1,000 base price)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <p className="font-semibold text-red-700">Guest</p>
                                <p className="text-lg font-bold">R{(1000 * (1 + parseInt(settings.guest_markup || '15') / 100)).toFixed(0)}</p>
                                <p className="text-xs text-gray-500">+{settings.guest_markup}%</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-orange-700">Staff</p>
                                <p className="text-lg font-bold">R{(1000 * (1 + parseInt(settings.staff_markup || '10') / 100)).toFixed(0)}</p>
                                <p className="text-xs text-green-600">-R{(1000 * (parseInt(settings.guest_markup || '15') - parseInt(settings.staff_markup || '10')) / 100).toFixed(0)} vs Guest</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-blue-700">Manager</p>
                                <p className="text-lg font-bold">R{(1000 * (1 + parseInt(settings.manager_markup || '5') / 100)).toFixed(0)}</p>
                                <p className="text-xs text-green-600">-R{(1000 * (parseInt(settings.guest_markup || '15') - parseInt(settings.manager_markup || '5')) / 100).toFixed(0)} vs Guest</p>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-green-700">Admin</p>
                                <p className="text-lg font-bold">R{(1000 * (1 + parseInt(settings.admin_markup || '0') / 100)).toFixed(0)}</p>
                                <p className="text-xs text-green-600">-R{(1000 * (parseInt(settings.guest_markup || '15') - parseInt(settings.admin_markup || '0')) / 100).toFixed(0)} vs Guest</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distributor Import Section */}
                <DistributorImport />

                {/* Generic Supplier Scraper */}
                <GenericScraper />

                {/* Legacy Linkqage Scraper (temporarily disabled) */}
                {/* <LinkqageScraper /> */}

                {/* Suppliers Section */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-4">Suppliers</h2>

                    <table className="w-full text-left mb-6">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Name</th>
                                <th className="p-2">Slug (ID)</th>
                                <th className="p-2">Parser Type</th>
                                <th className="p-2">URL</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(s => (
                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{s.name}</td>
                                    <td className="p-2 text-gray-600">{s.slug}</td>
                                    <td className="p-2 text-xs font-mono bg-gray-100 rounded">{s.type}</td>
                                    <td className="p-2 text-xs text-gray-500 truncate max-w-xs">{s.url}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-xs ${s.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {s.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => handleToggle(s.id, s.enabled)} className="text-sm text-blue-600 hover:underline">
                                            {s.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                        <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="font-semibold mb-2">Add New Supplier</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            placeholder="Name (e.g. MyStore)"
                            value={newName} onChange={e => setNewName(e.target.value)}
                            className="border p-2 rounded"
                            required
                        />
                        <input
                            placeholder="Unique Slug (e.g. mystore)"
                            value={newSlug} onChange={e => setNewSlug(e.target.value)}
                            className="border p-2 rounded"
                            required
                        />
                        <input
                            placeholder="XML Feed URL"
                            value={newUrl} onChange={e => setNewUrl(e.target.value)}
                            className="border p-2 rounded md:col-span-1"
                            required
                        />
                        <select
                            value={newType}
                            onChange={e => setNewType(e.target.value)}
                            className="border p-2 rounded"
                        >
                            <option value="scoop">Scoop Parser</option>
                            <option value="esquire">Esquire Parser</option>
                            <option value="syntech">Syntech Parser</option>
                            <option value="pinnacle">Pinnacle Parser</option>
                        </select>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add Supplier</button>
                    </form>
                </div>
            </div>
        </main>
    );
}
