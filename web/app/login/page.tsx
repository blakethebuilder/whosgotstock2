'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to home page or dashboard
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F1] dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            WHOSGOT<span className="text-orange-500 ml-0.5">STOCK</span>
          </h1>
          <h2 className="mt-6 text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Or{' '}
            <Link href="/register" className="font-bold text-orange-600 dark:text-orange-500 hover:text-orange-500 transition-colors">
              create a new reseller account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-white dark:border-gray-800/80 transition-all duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="your.email@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider">
                <span className="px-3 bg-white/70 dark:bg-gray-900/70 text-gray-400 backdrop-blur rounded-full">Or continue with legacy access</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/"
                className="btn-secondary w-full text-center block text-xs font-black uppercase tracking-widest py-3.5 rounded-xl border border-gray-200/50 dark:border-gray-800 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
              >
                Use Passphrase Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}