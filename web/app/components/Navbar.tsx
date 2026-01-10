'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { CartItem, UserRole, UsageStats } from '../types';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  cart: CartItem[];
  onCartOpen: () => void;
  userRole: UserRole;
  usageStats: UsageStats;
  onRoleSwitch: () => void;
  onClearSearch: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Navbar({ 
  cart, 
  onCartOpen, 
  userRole, 
  usageStats, 
  onRoleSwitch, 
  onClearSearch,
  searchQuery,
  onSearchChange
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'public': return 'bg-gray-400';
      case 'team': return 'bg-blue-500';
      case 'management': return 'bg-indigo-600';
      case 'admin': return 'bg-emerald-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <nav className="fixed top-6 w-full z-[100] px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800/40 px-6 py-3 rounded-[2rem] shadow-2xl shadow-gray-200/50 dark:shadow-none">
        
        {/* Logo - nitec style */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClearSearch}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                <span className="text-white dark:text-gray-900 font-black text-xl">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden md:block">
              stock.
            </span>
          </button>
        </div>

        {/* Centered Search - Integrated into Navbar like inspiration */}
        <div className="flex-1 max-w-xl hidden sm:flex relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-gray-100/50 dark:bg-gray-800/50 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-gray-800 transition-all outline-none text-gray-900 dark:text-white"
            />
            {/* Quick Filter Icon (Visual Only like image) */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-7 h-7 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center text-white cursor-pointer hover:bg-orange-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
            </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          
          <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl border border-white/20">
              <button
                onClick={onCartOpen}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-orange-600 text-white text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </button>
              
              <button
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
              </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Role / Profile Area */}
          <button
            onClick={onRoleSwitch}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">
                {user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Guest'}
              </p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                {userRole} tier
              </p>
            </div>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover:scale-105 active:scale-95 ${getRoleColor(userRole)}`}>
               {user ? (
                 <span className="text-white font-black text-sm">{user.firstName.charAt(0)}</span>
               ) : (
                 <svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
               )}
            </div>
          </button>

        </div>
      </div>
    </nav>
  );
}