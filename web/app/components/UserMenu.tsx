'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/login"
          className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="btn-primary btn-sm"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full badge ${getRoleColor(user.role)}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">{user.companyName}</p>
              <div className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full badge ${getRoleColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account
              </div>
            </div>
            
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            
            <Link
              href="/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Account Settings
            </Link>
            
            {(user.role === 'staff' || user.role === 'partner') && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            
            <div className="border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}