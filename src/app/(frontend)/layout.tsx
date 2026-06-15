import React from 'react'
import './styles.css'

export const metadata = {
  title: 'OurMoon Education CMS',
  description: 'OurMoon Education Content Management System',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
