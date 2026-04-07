"use client";
import React from 'react'

type AdminPanelProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export default function AdminPanel({ title, subtitle, children, className = '', actions }: AdminPanelProps) {
  return (
    <section className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} aria-label={title}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </section>
  )
}
