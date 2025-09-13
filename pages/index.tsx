import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          IG Preview
        </h1>
        <p className="text-gray-600 mb-8">
          A private place to upload portrait photos and generate time-limited preview links.
        </p>
        <Link
          href="/admin"
          className="btn-primary inline-block"
        >
          Go to Admin
        </Link>
      </div>
    </div>
  )
}