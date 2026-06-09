'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    role: 'free'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to home page or dashboard
        router.push('/');
        router.refresh();
      } else {
        console.error('Registration failed:', data);
        if (data.errors && Array.isArray(data.errors)) {
          // Show validation errors
          const errorMessages = data.errors.map((err: any) => err.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Or{' '}
            <Link href="/login" className="font-bold text-orange-600 dark:text-orange-500 hover:text-orange-500 transition-colors">
              sign in to existing reseller account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-[2.5rem] sm:px-10 border border-white dark:border-gray-800/80 transition-all duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-955/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-bold animate-pulse">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="First name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                Email address
              </label>
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

            <div>
              <label htmlFor="companyName" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="input-field"
                placeholder="Company name"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field cursor-pointer bg-white dark:bg-gray-800"
              >
                <option value="free">Free (25 searches/month)</option>
                <option value="professional">Professional (R399/month)</option>
                <option value="enterprise">Enterprise (R1599/month)</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-black uppercase text-gray-400 dark:text-gray-550 tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all"
              >
                {loading ? 'Creating account...' : 'Create account'}
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