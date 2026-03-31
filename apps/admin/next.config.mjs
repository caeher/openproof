import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3001'

function normalizeBackendUrl(value) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return DEFAULT_BACKEND_URL
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed)
    if (url.hostname === '0.0.0.0') {
      url.hostname = '127.0.0.1'
    }

    return url.toString().replace(/\/$/, '')
  }

  const normalizedHost = trimmed.replace(/^0\.0\.0\.0(?=[:/]|$)/, '127.0.0.1')
  return `http://${normalizedHost}`.replace(/\/$/, '')
}

const backend = normalizeBackendUrl(process.env.BACKEND_URL)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
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