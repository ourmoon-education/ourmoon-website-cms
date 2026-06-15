import React from 'react'
import { MoonFaceIcon } from './Logo'

export const Icon: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
    }}
    title="OurMoon Education"
  >
    <MoonFaceIcon width={24} height={36} />
  </div>
)

export default Icon
