'use client';
import { useEffect, useState } from 'react';
import AdminPanel from '../../components/admin/AdminPanel';

type EvData = {
  name: string;
  internal_sku: string;
  internal_price: string;
  is_available: boolean;
  raw_stock_text?: string;
  url: string;
}[];

export default function EvetechAdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EvData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/evetech')
      .then(res => res.json())
      .then((resp) => {
        if (resp && resp.stdout) {
          // stdout is expected to be a JSON string; try parse
          try {
            const parsed = JSON.parse(resp.stdout);
            setData(parsed as EvData);
          } catch {
            // if stdout isn't JSON, just store as raw string in data array
            setData(null);
          }
        } else {
          setData(null);
        }
      })
      .catch((e) => setError(e?.message ?? 'Failed to fetch'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPanel title="Evetech Data" subtitle="Virtual API results" className="p-6">
      <h1 className="text-2xl font-bold mb-4">Evetech Virtual API</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && data && Array.isArray(data) && (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">In Stock</th>
              <th className="px-3 py-2 text-left">URL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((p, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">{p.internal_sku}</td>
                <td className="px-3 py-2">{p.internal_price}</td>
                <td className="px-3 py-2">{p.is_available ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2"><a href={p.url} target="_blank" rel="noreferrer" className="text-blue-600">Link</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && (!data || data.length === 0) && (
        <p className="text-gray-600">No Evetech data yet. Trigger the admin API to fetch.</p>
      )}
    </AdminPanel>
  );
}
