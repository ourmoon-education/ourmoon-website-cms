import React from 'react'

export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.25rem 0',
    }}
  >
    <span
      style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--theme-elevation-900)',
        letterSpacing: '-0.02em',
      }}
    >
      🌙 OurMoon Education
    </span>
  </div>
)

export default Logo
