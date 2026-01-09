'use client';

import { useState } from 'react';
import { Database, Play, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export default function DatabaseManagement() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runSearchIndexMigration = async () => {
    setMigrationStatus('running');
    setError(null);

    try {
      const response = await fetch('/api/admin/migrate-search-indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMigrationStatus('success');
        setMigrationResult(data);
      } else {
        setMigrationStatus('error');
        setError(data.error?.message || 'Migration failed');
      }

    } catch (err) {
      setMigrationStatus('error');
      setError(err instanceof Error ? err.message : 'Migration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Database Management
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Database operations, migrations, and maintenance
        </p>
      </div>

      {/* Search Performance Migration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Search Performance Migration
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Apply database indexes and full-text search optimizations for better search performance.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={runSearchIndexMigration}
            disabled={migrationStatus === 'running'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {migrationStatus === 'running' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {migrationStatus === 'running' ? 'Running Migration...' : 'Run Migration'}
          </button>

          {migrationStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Migration completed successfully</span>
            </div>
          )}

          {migrationStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Migration failed</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {migrationResult && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Migration Results:</h4>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p>✓ Search vector column: {migrationResult.verification?.search_vector_column ? 'Created' : 'Failed'}</p>
              <p>✓ Analytics table: {migrationResult.verification?.analytics_table ? 'Created' : 'Failed'}</p>
              <p>✓ Total products: {migrationResult.verification?.product_stats?.total_products || 0}</p>
              <p>✓ Products with search vectors: {migrationResult.verification?.product_stats?.products_with_search_vector || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Database Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {migrationResult?.verification?.product_stats?.total_products || '---'}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Total Products
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {migrationResult?.verification?.product_stats?.products_in_stock || '---'}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              In Stock
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {migrationResult?.verification?.product_stats?.products_with_search_vector || '---'}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              Search Optimized
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}