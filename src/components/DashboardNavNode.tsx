'use client'

import React from 'react'
import Link from 'next/link'

export const DashboardNavNode: React.FC = () => {
  return (
    <div
      className="nav-group"
      style={{ marginTop: '1rem', marginBottom: '1rem' }}
    >
      <Link
        href="/admin"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: 'var(--theme-elevation-800)',
          fontWeight: 600,
          padding: '4px 0',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Dashboard
      </Link>
    </div>
  )
}
