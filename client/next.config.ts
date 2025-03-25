import type { NextConfig } from 'next'
import NextBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = NextBundleAnalyzer()

const nextConfig: NextConfig = {
  /* config options here */
}

export default process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig
