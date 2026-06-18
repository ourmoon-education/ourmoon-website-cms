import Link from 'next/link'
import React from 'react'

export const DashboardLink: React.FC = () => {
  return (
    <div className="nav-group">
      <div className="nav-group__content">
        <ul className="nav-group__list">
          <li className="nav-group__list-item">
            <Link 
              href="/admin" 
              className="nav__link" 
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
