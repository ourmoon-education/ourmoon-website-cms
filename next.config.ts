import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', 'drizzle-kit'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ourmoonwebassets.blob.core.windows.net',
        pathname: '/assets/**',
      },
    ],
  },
  experimental: {
    // Use Rust-based turbotrace instead of JS nft for file tracing.
    // nft loads all 791 packages into the JS heap and OOMs on small VPS.
    // turbotrace does the same work in Rust using ~90% less memory.
    turbotrace: {
      logLevel: 'error',
      contextDirectory: path.resolve(dirname, '../../'),
    },
    // Exclude heavy directories that don't need to be traced
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
        'node_modules/webpack',
        'node_modules/terser',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
