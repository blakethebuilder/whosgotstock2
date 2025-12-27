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
        free_markup: '15',
        professional_markup: '5',
        enterprise_markup: '0',
        staff_markup: '10',
        partner_markup: '0'
    });
    const [loading, setLoading] = useState(true);

    // Component visibility state
    const [showScraper, setShowScraper] = useState(false);

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
                body: JSON.stringify({ passphrase, role: 'partner' })
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
            console.log('Fetching suppliers and settings...');
            const [supRes, setRes] = await Promise.all([
                fetch('/api/admin/suppliers'),
                fetch('/api/admin/settings')
            ]);
            
            console.log('Suppliers response status:', supRes.status);
            console.log('Settings response status:', setRes.status);
            
            if (!supRes.ok) {
                console.error('Suppliers API error:', supRes.status, supRes.statusText);
            }
            if (!setRes.ok) {
                console.error('Settings API error:', setRes.status, setRes.statusText);
            }
            
            const supData = await supRes.json();
            const setData = await setRes.json();
            
            console.log('Suppliers data:', supData);
            console.log('Settings data:', setData);
            
            setSuppliers(supData || []);
            setSettings(setData || {
                update_interval_minutes: '60',
                free_markup: '15',
                professional_markup: '5',
                enterprise_markup: '0',
                staff_markup: '10',
                partner_markup: '0'
            });
        } catch (e) {
            console.error('Error fetching data:', e);
            // Set default values on error
            setSuppliers([]);
            setSettings({
                update_interval_minutes: '60',
                free_markup: '15',
                professional_markup: '5',
                enterprise_markup: '0',
                staff_markup: '10',
                partner_markup: '0'
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
                        <h1 className="text-2xl font-bold text-gray-900">WhosGotStock Admin Portal</h1>
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
                                    <label className="block text-sm font-medium text-gray-900 mb-2">
                                        Update Interval (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.update_interval_minutes}
                                        onChange={(e) => setSettings({...settings, update_interval_minutes: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
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
                                    <span className="text-sm font-semibold text-red-600">Free:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.free_markup}
                                            onChange={(e) => setSettings({...settings, free_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-blue-600">Professional:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.professional_markup}
                                            onChange={(e) => setSettings({...settings, professional_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-purple-600">Enterprise:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.enterprise_markup}
                                            onChange={(e) => setSettings({...settings, enterprise_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-orange-600">Staff:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.staff_markup}
                                            onChange={(e) => setSettings({...settings, staff_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-600">Partner:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={settings.partner_markup}
                                            onChange={(e) => setSettings({...settings, partner_markup: e.target.value})}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white font-medium"
                                        />
                                        <span className="text-sm text-gray-900 font-medium">%</span>
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
                            <p className="text-xs text-gray-700 mb-3">Example: R1,000 base price</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-red-600 font-medium">Free:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.free_markup || '15') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-600 font-medium">Professional:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.professional_markup || '5') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-purple-600 font-medium">Enterprise:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.enterprise_markup || '0') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-orange-600 font-medium">Staff:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.staff_markup || '10') / 100)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-medium">Partner:</span>
                                    <span className="font-bold text-gray-900">R{(1000 * (1 + parseInt(settings.partner_markup || '0') / 100)).toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* XML Suppliers Management - First */}
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
                                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{supplier.name}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-700">{supplier.type}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            supplier.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {supplier.enabled ? 'Active' : 'Inactive'}
                                                        </span>
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
                                            placeholder="XML Feed URL"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-500"
                                        />
                                        <select
                                            value={newType}
                                            onChange={(e) => setNewType(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                                        >
                                            <option value="scoop">Scoop Parser</option>
                                            <option value="syntech">Syntech Parser</option>
                                            <option value="pinnacle">Pinnacle Parser</option>
                                            <option value="esquire">Esquire Parser</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddSupplier();
                                        }}
                                        className="mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                                    >
                                        Add XML Supplier
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Manual Product Import - Second */}
                        <DistributorImport />

                        {/* Generic Scraper - Last with close option */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Generic Web Scraper</h2>
                                        <p className="text-sm text-gray-600">Experimental feature - Currently inactive</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowScraper(!showScraper)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    {showScraper ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            Show
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {showScraper && (
                                <div className="p-6">
                                    <GenericScraper />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}