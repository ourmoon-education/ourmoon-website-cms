import Link from 'next/link'
import React from 'react'

export const DashboardLink: React.FC = () => {
  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--theme-elevation-100)', marginBottom: '1rem' }}>
      <Link 
        href="/admin" 
        style={{ 
          display: 'block', 
          padding: '0.75rem 1rem', 
          backgroundColor: 'var(--theme-success-500, #10b981)', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
