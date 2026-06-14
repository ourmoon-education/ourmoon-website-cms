import React from 'react'

export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.25rem 0',
    }}
  >
    <MoonFaceIcon width={32} height={48} />
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 700,
          fontSize: '1.05rem',
          color: '#128f8b',
          letterSpacing: '0.04em',
        }}
      >
        Our Moon
      </span>
      <span
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 600,
          fontSize: '0.7rem',
          color: 'var(--theme-elevation-500)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Education
      </span>
    </div>
  </div>
)

export const MoonFaceIcon: React.FC<{ width?: number; height?: number }> = ({
  width = 40,
  height = 60,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 90"
    width={width}
    height={height}
    aria-label="OurMoon Education logo"
    role="img"
  >
    {/* Crescent body: right-weighted oval with slightly inset left edge */}
    <path
      d="M30,4 C24,8 18,22 18,45 C18,68 24,82 30,86 C44,86 56,68 56,45 C56,22 44,4 30,4 Z"
      fill="#e4eb62"
    />

    {/* Triple-moon crescents (top of face) */}
    {/* Left crescent */}
    <circle cx="26" cy="22" r="6" fill="#128f8b" />
    <circle cx="29" cy="20" r="4.5" fill="#e4eb62" />
    {/* Centre crescent */}
    <circle cx="36" cy="18" r="6" fill="#128f8b" />
    <circle cx="39" cy="16" r="4.5" fill="#e4eb62" />
    {/* Right crescent */}
    <circle cx="46" cy="21" r="5.5" fill="#128f8b" />
    <circle cx="49" cy="19" r="4" fill="#e4eb62" />

    {/* Eyes */}
    <ellipse cx="30" cy="50" rx="7" ry="4.5" fill="#128f8b" />
    <ellipse cx="46" cy="50" rx="7" ry="4.5" fill="#128f8b" />

    {/* Nose line */}
    <rect x="36.5" y="57" width="3" height="14" rx="1.5" fill="#128f8b" />

    {/* Chin: circle with vertical cutout */}
    <circle cx="38" cy="78" r="7" fill="#128f8b" />
    <rect x="36.5" y="74" width="3" height="8" rx="1" fill="#e4eb62" />
  </svg>
)

export default Logo
