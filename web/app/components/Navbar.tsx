'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { CartItem, UserRole, UsageStats, Project } from '../types';
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
  compareCount: number;
  onCompareOpen: () => void;
  projects: Project[];
  currentProjectId?: string;
  onProjectChange: (projectId?: string) => void;
}

export default function Navbar({
  cart,
  onCartOpen,
  userRole,
  usageStats,
  onRoleSwitch,
  onClearSearch,
  searchQuery,
  onSearchChange,
  compareCount,
  onCompareOpen
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
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-2 sm:gap-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800/40 px-3 sm:px-6 py-2.5 sm:py-3 rounded-[2rem] shadow-2xl shadow-gray-200/50 dark:shadow-none">

        {/* Logo - WhosGotStock */}
        <div className="flex-shrink-0">
          <button
            onClick={onClearSearch}
            className="flex items-center group"
          >
            <div className="bg-gray-900 dark:bg-white px-1.5 sm:px-5 h-8 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 shadow-lg shadow-gray-200 dark:shadow-none border border-white/10">
              <span className="text-white dark:text-gray-900 font-black text-[9px] sm:text-sm tracking-tighter uppercase whitespace-nowrap">
                <span className="hidden xs:inline">WHOSGOT</span><span className="text-orange-500 inline ml-0.5 sm:ml-1">STOCK</span>
              </span>
            </div>
          </button>
        </div>

        {/* Centered Search - Integrated into Navbar like inspiration */}
        <div className="flex-1 min-w-0 flex relative group">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 rounded-lg sm:rounded-2xl py-1.5 sm:py-2.5 pl-7 sm:pl-12 pr-8 sm:pr-24 text-xs sm:text-sm font-semibold focus:bg-white dark:focus:bg-gray-900 transition-all outline-none text-gray-900 dark:text-white"
          />
          <div className="absolute inset-y-0 right-14 sm:right-16 flex items-center pointer-events-none">
            <span className="hidden sm:inline-block px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-[9px] font-black text-gray-400 bg-white/50 dark:bg-gray-800/50">⌘K</span>
          </div>
          {/* Quick Filter Icon */}
          <div className="absolute inset-y-0 right-0 pr-1 sm:pr-3 flex items-center gap-0.5 sm:gap-2">
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="w-5 h-5 sm:w-7 sm:h-7 bg-gray-900 dark:bg-gray-700 rounded-md sm:rounded-lg flex items-center justify-center text-white cursor-pointer hover:bg-orange-500 transition-colors">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">

           <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl border border-white/20">
             <button
               onClick={onCartOpen}
               className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all relative"
               title="Quote Cart"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               {cartItemCount > 0 && (
                 <span className="absolute top-1 right-1 bg-orange-600 text-white text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                   {cartItemCount}
                 </span>
               )}
             </button>

             <button
               onClick={onCompareOpen}
               className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all relative"
               title="Compare Products"
             >
               <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
               {compareCount > 0 && (
                 <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-full">
                   {compareCount}
                 </span>
               )}
             </button>
           </div>
           
           {/* Site/Project Selector */}
           <div className="hidden sm:flex items-center gap-2">
             <div className="relative group">
               <select
                 className="bg-gray-100/50 dark:bg-gray-800/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors appearance-none pr-6"
                 title="Current Site/Project"
               >
                 <option value="">Main Quote</option>
                 {projects.map(project => (
                   <option key={project.id} value={project.id}>{project.name}</option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
               </div>
             </div>
           </div>

          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Role / Profile Area */}
          <div className="flex items-center gap-1">
            <button
              onClick={onRoleSwitch}
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">
                  {user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Guest Access'}
                </p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">
                  {userRole} tier
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform group-hover:scale-105 active:scale-95 ${getRoleColor(userRole)}`}>
                {user ? (
                  <span className="text-white font-black text-xs sm:text-sm">{user.firstName.charAt(0)}</span>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                )}
              </div>
            </button>

            {userRole === 'admin' && (
              <a
                href="/admin"
                className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                title="Admin Portal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </a>
            )}

            {userRole !== 'public' && (
              <button
                onClick={() => {
                  localStorage.removeItem('whosgotstock_user_role');
                  window.location.reload();
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout / Reset Session"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
