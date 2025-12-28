'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import ThemeToggle from './ThemeToggle';
import { CartItem, UserRole, UsageStats } from '../types';

interface NavbarProps {
  cart: CartItem[];
  onCartOpen: () => void;
  userRole: UserRole;
  usageStats: UsageStats;
  onRoleSwitch: () => void;
  onClearSearch: () => void;
}

export default function Navbar({ 
  cart, 
  onCartOpen, 
  userRole, 
  usageStats, 
  onRoleSwitch, 
  onClearSearch 
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'public': return 'bg-gray-400';
      case 'team': return 'bg-blue-500';
      case 'management': return 'bg-purple-500';
      case 'admin': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <nav className="absolute top-0 w-full z-50 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <button
          onClick={onClearSearch}
          className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-80 transition-opacity"
        >
          WhosGotStock
        </button>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Quote Cart */}
          <button
            onClick={onCartOpen}
            className="relative p-2.5 bg-white/90 dark:bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-200/50 hover:bg-white dark:hover:bg-white transition-all shadow-sm hover:shadow-md"
            title="Quote Cart"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>

          {/* User Authentication */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 bg-white/90 dark:bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-200/50 hover:bg-white dark:hover:bg-white transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-900">
                    {user.firstName}
                  </div>
                  <div className={`text-xs px-2 py-0.5 rounded-full text-white ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </div>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-white rounded-xl shadow-xl border border-gray-200 dark:border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-100">
                      <p className="font-semibold text-gray-900 dark:text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{user.companyName}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Account Settings
                      </Link>
                      {(user.role === 'management' || user.role === 'admin') && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-600 hover:bg-red-50 dark:hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Legacy Role Switcher */}
              <button
                onClick={onRoleSwitch}
                className="flex items-center space-x-2 px-3 py-2 bg-white/90 dark:bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-200/50 hover:bg-white dark:hover:bg-white transition-all shadow-sm hover:shadow-md text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-gray-900 capitalize">
                  {userRole === 'public' ? 'Public' : userRole === 'team' ? 'Team' : userRole === 'management' ? 'Management' : 'Admin'}
                </span>
                <div className={`w-2 h-2 rounded-full ${getRoleColor(userRole)}`} />
                {userRole === 'public' && (
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {usageStats.searchesThisMonth}/{usageStats.searchLimit}
                  </span>
                )}
              </button>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-700 hover:text-gray-900 dark:hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}