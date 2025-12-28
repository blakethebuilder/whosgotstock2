'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
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
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasAdminAccess = userRole === 'enterprise' || userRole === 'staff' || userRole === 'partner';

  return (
    <nav className="absolute top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={onClearSearch}
              className="text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-80 transition-opacity cursor-pointer"
            >
              WhosGotStock
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Quote Cart */}
            <button
              onClick={onCartOpen}
              className="relative group flex items-center justify-center w-11 h-11 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
              title="Quote Cart"
            >
              {/* Modern Quote/Document Icon */}
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              
              {/* Cart Badge */}
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-white dark:border-gray-800 animate-pulse">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* User Authentication */}
            {user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Legacy Role Indicator (for non-authenticated users) */}
            {!user && (
              <button
                onClick={onRoleSwitch}
                className={`flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md ${
                  userRole !== 'free' ? 'ring-2 ring-blue-500/20' : ''
                }`}
              >
                <span className="text-gray-800 dark:text-gray-200 capitalize">
                  {userRole === 'free' ? 'Free' : userRole === 'professional' ? 'Pro' : userRole === 'enterprise' ? 'Enterprise' : userRole === 'staff' ? 'Staff' : 'Partner'}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  userRole === 'free' ? 'bg-gray-400' : 
                  userRole === 'professional' ? 'bg-blue-500' : 
                  userRole === 'enterprise' ? 'bg-purple-500' : 
                  userRole === 'staff' ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                {userRole === 'free' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {usageStats.searchesThisMonth}/{usageStats.searchLimit}
                  </span>
                )}
              </button>
            )}

            {/* Admin Link */}
            {hasAdminAccess && (
              <Link
                href="/admin"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 space-y-4 mb-4">
              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                <ThemeToggle />
              </div>

              {/* Mobile Cart */}
              <button
                onClick={() => {
                  onCartOpen();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quote Cart</span>
                </div>
                {cartItemCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Auth */}
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full text-center py-2 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Role Switcher (for non-authenticated) */}
              {!user && (
                <button
                  onClick={() => {
                    onRoleSwitch();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Plan: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    userRole === 'free' ? 'bg-gray-400' : 
                    userRole === 'professional' ? 'bg-blue-500' : 
                    userRole === 'enterprise' ? 'bg-purple-500' : 
                    userRole === 'staff' ? 'bg-orange-500' : 'bg-green-500'
                  }`} />
                </button>
              )}

              {/* Mobile Admin Link */}
              {hasAdminAccess && (
                <Link
                  href="/admin"
                  className="block w-full text-center py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}