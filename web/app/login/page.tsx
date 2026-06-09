'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'user' | 'passphrase'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUserSubmit = async (e: React.FormEvent) => {
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
        // Clear local storage passphrase role if logged in as user to avoid conflicts
        localStorage.removeItem('whosgotstock_user_role');
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

  const handlePassphraseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) return;

    setLoading(true);
    setError('');

    const roles = ['guest', 'team', 'reseller', 'admin'];
    let verified = false;

    for (const role of roles) {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passphrase, role }),
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('whosgotstock_user_role', data.role);
          verified = true;
          router.push('/');
          router.refresh();
          break;
        }
      } catch (error) {
        console.error('Verify error:', error);
      }
    }

    if (!verified) {
      setError('Invalid access passphrase');
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
            Welcome to WhosGotStock
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Choose your login method below
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-white dark:border-gray-800/80 transition-all duration-300">
          
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-2xl mb-8 border border-gray-200/50 dark:border-gray-800">
            <button
              onClick={() => { setAuthMode('user'); setError(''); }}
              className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                authMode === 'user'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md shadow-gray-200/50 dark:shadow-none'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              User Login
            </button>
            <button
              onClick={() => { setAuthMode('passphrase'); setError(''); }}
              className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                authMode === 'passphrase'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md shadow-gray-200/50 dark:shadow-none'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              Passphrase Access
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold mb-6">
              {error}
            </div>
          )}

          {authMode === 'user' ? (
            <form className="space-y-6" onSubmit={handleUserSubmit}>
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
          ) : (
            <form className="space-y-6" onSubmit={handlePassphraseSubmit}>
              <div>
                <label htmlFor="passphrase" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                  Passphrase Code
                </label>
                <div className="mt-1">
                  <input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="input-field"
                    placeholder="Enter Access Passphrase"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify & Enter'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}