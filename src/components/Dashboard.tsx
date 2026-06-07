'use client'

import React, { useEffect, useState } from 'react'

type Stats = {
  programmes: number
  blogPosts: number
  events: number
  studentStories: number
}

const StatCard: React.FC<{ label: string; count: number; href: string; createHref: string }> = ({
  label,
  count,
  href,
  createHref,
}) => (
  <div
    style={{
      background: 'var(--theme-elevation-50)',
      border: '1px solid var(--theme-elevation-200)',
      borderRadius: '8px',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}
  >
    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--theme-elevation-900)' }}>
      {count}
    </div>
    <div style={{ fontSize: '0.875rem', color: 'var(--theme-elevation-500)', fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
      <a
        href={href}
        style={{ fontSize: '0.8rem', color: 'var(--theme-text)', textDecoration: 'underline' }}
      >
        View all
      </a>
      <a
        href={createHref}
        style={{ fontSize: '0.8rem', color: 'var(--theme-success-500)', textDecoration: 'underline' }}
      >
        + Create new
      </a>
    </div>
  </div>
)

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ programmes: 0, blogPosts: 0, events: 0, studentStories: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prog, blog, evts, stories] = await Promise.all([
          fetch('/api/programmes?limit=0&depth=0').then((r) => r.json()),
          fetch('/api/blog-posts?limit=0&depth=0').then((r) => r.json()),
          fetch('/api/events?limit=0&depth=0').then((r) => r.json()),
          fetch('/api/student-stories?limit=0&depth=0').then((r) => r.json()),
        ])
        setStats({
          programmes: prog.totalDocs ?? 0,
          blogPosts: blog.totalDocs ?? 0,
          events: evts.totalDocs ?? 0,
          studentStories: stories.totalDocs ?? 0,
        })
      } catch {
        // Stats unavailable — not critical
      }
    }
    void fetchStats()
  }, [])

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
          🌙 Welcome to OurMoon Education CMS
        </h1>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          Manage programmes, blog posts, events, and student stories from here.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          label="Programmes"
          count={stats.programmes}
          href="/admin/collections/programmes"
          createHref="/admin/collections/programmes/create"
        />
        <StatCard
          label="Blog Posts"
          count={stats.blogPosts}
          href="/admin/collections/blog-posts"
          createHref="/admin/collections/blog-posts/create"
        />
        <StatCard
          label="Events"
          count={stats.events}
          href="/admin/collections/events"
          createHref="/admin/collections/events/create"
        />
        <StatCard
          label="Student Stories"
          count={stats.studentStories}
          href="/admin/collections/student-stories"
          createHref="/admin/collections/student-stories/create"
        />
      </div>

      <div
        style={{
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Quick Links</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <a
            href="https://ourmoon.org.uk"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}
          >
            🌐 View live website
          </a>
          <a
            href="/admin/globals/site-settings"
            style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}
          >
            ⚙️ Site settings
          </a>
          <a
            href="/admin/collections/media"
            style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}
          >
            🖼️ Media library
          </a>
          <a
            href="/admin/collections/redirects"
            style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}
          >
            🔀 Redirects
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
