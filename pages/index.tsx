import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

export default function HomePage() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>IG Preview - Professional Photo Gallery & Preview Links</title>
        <meta name="description" content="Create stunning photo galleries and generate secure, time-limited preview links for your professional photography. Perfect for photographers, models, and creative professionals." />
        <meta name="keywords" content="photo gallery, preview links, photography, portfolio, secure sharing, professional photos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="IG Preview - Professional Photo Gallery & Preview Links" />
        <meta property="og:description" content="Create stunning photo galleries and generate secure, time-limited preview links for your professional photography." />
        <meta property="og:type" content="website" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              {/* Logo/Brand */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
                  IG Preview
                </h1>
              </div>
              
              {/* Main Headline */}
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
                Create Beautiful Photo Galleries with
                <span className="text-purple-600"> Secure Preview Links</span>
              </h2>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Perfect for photographers, models, and creative professionals. Upload your photos, 
                create stunning galleries, and share secure time-limited preview links with clients.
              </p>
              
              {/* CTA Button */}
              <div className="flex justify-center items-center mb-16">
                <Link
                  href="/admin"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Start Creating Gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose IG Preview?</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Professional-grade photo sharing with security and style in mind.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-6">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Secure & Private</h4>
                <p className="text-gray-600">
                  Time-limited preview links ensure your photos are only accessible when you want them to be.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Beautiful Design</h4>
                <p className="text-gray-600">
                  Instagram-style grid layout that showcases your photos in the best possible light.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h4>
                <p className="text-gray-600">
                  Optimized image loading and responsive design for the best viewing experience on any device.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-600">
              © 2024 IG Preview. Built for creative professionals.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}