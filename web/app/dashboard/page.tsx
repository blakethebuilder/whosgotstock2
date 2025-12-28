'use client';

import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageData {
  searchesThisMonth: number;
  searchLimit: number;
  quotesGenerated: number;
  lastLogin: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/user/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'free': return 'tier-free';
      case 'professional': return 'tier-professional';
      case 'enterprise': return 'tier-enterprise';
      case 'staff': return 'tier-staff';
      case 'partner': return 'tier-partner';
      default: return 'tier-free';
    }
  };

  const getRoleFeatures = (role: string) => {
    switch (role) {
      case 'free':
        return {
          searches: '25 searches/month',
          pricing: '15% markup',
          quotes: 'Watermarked quotes',
          support: 'Community support'
        };
      case 'professional':
        return {
          searches: 'Unlimited searches',
          pricing: '5% handling fee',
          quotes: 'Professional quotes',
          support: 'Email support'
        };
      case 'enterprise':
        return {
          searches: 'Unlimited searches',
          pricing: 'No markup',
          quotes: 'White-labeled quotes',
          support: 'Priority support'
        };
      case 'staff':
        return {
          searches: 'Unlimited searches',
          pricing: '10% markup (configurable)',
          quotes: 'Internal quotes',
          support: 'Internal support'
        };
      case 'partner':
        return {
          searches: 'Unlimited searches',
          pricing: 'Cost pricing',
          quotes: 'Admin quotes',
          support: 'Direct support'
        };
      default:
        return {
          searches: '25 searches/month',
          pricing: '15% markup',
          quotes: 'Watermarked quotes',
          support: 'Community support'
        };
    }
  };

  const features = getRoleFeatures(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-black text-blue-600 hover:opacity-80">
                WhosGotStock
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <Link
              href="/"
              className="btn-primary btn-sm"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user.firstName}!
                  </h2>
                  <p className="text-gray-600">
                    {user.companyName} • {user.email}
                  </p>
                </div>
                <div className={`badge ${getRoleColor(user.role)} text-sm px-3 py-2`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account
                </div>
              </div>

              {/* Usage Stats */}
              {loadingUsage ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Searches This Month</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {usageData?.searchesThisMonth || 0}
                            {user.role === 'public' && (
                              <span className="text-sm font-normal text-blue-600">
                                /{usageData?.searchLimit || 25}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Quotes Generated</p>
                          <p className="text-2xl font-bold text-green-900">
                            {usageData?.quotesGenerated || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-6">
            {/* Account Type */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Features</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Searches</span>
                  <span className="text-sm font-medium text-gray-900">{features.searches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pricing</span>
                  <span className="text-sm font-medium text-gray-900">{features.pricing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quotes</span>
                  <span className="text-sm font-medium text-gray-900">{features.quotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Support</span>
                  <span className="text-sm font-medium text-gray-900">{features.support}</span>
                </div>
              </div>

              {user.role === 'public' && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link
                    href="/upgrade"
                    className="btn-primary w-full text-center block"
                  >
                    Upgrade Account
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="btn-secondary w-full text-center block"
                >
                  Start New Search
                </Link>
                <Link
                  href="/account"
                  className="btn-secondary w-full text-center block"
                >
                  Account Settings
                </Link>
              {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="btn-secondary w-full text-center block"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}