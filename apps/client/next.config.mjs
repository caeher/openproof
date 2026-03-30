import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const backend =
  process.env.BACKEND_URL?.replace(/\/$/, '') || 'http://127.0.0.1:3001'

const nextConfig = {
  output: 'standalone',
  // Monorepo: keep Turbopack root at this app (not the repo root)
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
