'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [settings, setSettings] = useState({
        update_interval_minutes: '60',
        guest_markup: '15'
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
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Guest Markup Percentage (%):</label>
                            <input
                                type="number"
                                value={settings.guest_markup}
                                onChange={e => setSettings({ ...settings, guest_markup: e.target.value })}
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
