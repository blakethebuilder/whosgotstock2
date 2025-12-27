'use client';

import { useState, useEffect } from 'react';
import DistributorImport from '../components/DistributorImport';
import GenericScraper from '../components/GenericScraper';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [authError, setAuthError] = useState('');
    
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
                    enabled: !supplier.active 
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
            setNewType('scoop');
            refreshData();
        } catch (error) {
            alert('Failed to add supplier');
        }
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
                                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                                placeholder="Admin passphrase"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        {authError && (
                            <div className="text-red-600 text-sm text-center">{authError}</div>
                        )}
                        
                        <button
                            onClick={handleAuth}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
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
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                        <div className="flex items-center gap-4">
                            <a 
                                href="/" 
                                className="text-blue-600 hover:text-blue-700 font-medium"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Update Interval (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.update_interval_minutes}
                                        onChange={(e) => setSettings({...settings, update_interval_minutes: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>

                        {/* Pricing Tiers */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Tiers</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-red-600">Guest:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.guest_markup}
                                            onChange={(e) => setSettings({...settings, guest_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-orange-600">Staff:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.staff_markup}
                                            onChange={(e) => setSettings({...settings, staff_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-blue-600">Manager:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.manager_markup}
                                            onChange={(e) => setSettings({...settings, manager_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-green-600">Admin:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.admin_markup}
                                            onChange={(e) => setSettings({...settings, admin_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-500">%</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUpdateSettings}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium mt-3"
                                >
                                    Update Pricing
                                </button>
                            </div>
                        </div>

                        {/* Pricing Preview */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing Preview</h3>
                            <p className="text-xs text-gray-500 mb-3">Example: R1,000 base price</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-red-600">Guest:</span>
                                    <span className="font-semibold">R{(1000 * (1 + parseInt(settings.guest_markup || '15') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-orange-600">Staff:</span>
                                    <span className="font-semibold">R{(1000 * (1 + parseInt(settings.staff_markup || '10') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-600">Manager:</span>
                                    <span className="font-semibold">R{(1000 * (1 + parseInt(settings.manager_markup || '5') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600">Admin:</span>
                                    <span className="font-semibold">R{(1000 * (1 + parseInt(settings.admin_markup || '0') / 100)).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Manual Product Import */}
                        <DistributorImport />

                        {/* Generic Scraper */}
                        <GenericScraper />

                        {/* Suppliers Management */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">XML Suppliers Management</h2>
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {suppliers.map((supplier) => (
                                                <tr key={supplier.id}>
                                                    <td className="px-4 py-2 text-sm text-gray-900">{supplier.name}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">{supplier.type}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            supplier.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {supplier.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleToggleSupplier(supplier.id)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                            >
                                                                {supplier.active ? 'Disable' : 'Enable'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSupplier(supplier.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add New Supplier */}
                                <div className="border-t pt-4">
                                    <h3 className="text-md font-medium text-gray-900 mb-3">Add New XML Supplier</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. MySupplier)"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Slug (e.g. mysupplier)"
                                            value={newSlug}
                                            onChange={(e) => setNewSlug(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <input
                                            type="url"
                                            placeholder="XML Feed URL"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="scoop">Scoop Parser</option>
                                            <option value="syntech">Syntech Parser</option>
                                            <option value="pinnacle">Pinnacle Parser</option>
                                            <option value="esquire">Esquire Parser</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddSupplier}
                                        className="mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                                    >
                                        Add XML Supplier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}