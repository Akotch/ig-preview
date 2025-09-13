import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { GetServerSideProps } from 'next'

interface PhotoData {
  id: string
  caption: string | null
  tags: string[] | null
  signedUrl: string
}

interface PreviewPageProps {
  initialPhotos?: PhotoData[]
  error?: string
}

export default function PreviewPage({ initialPhotos, error }: PreviewPageProps) {
  const router = useRouter()
  const { token } = router.query
  const [photos, setPhotos] = useState<PhotoData[]>(initialPhotos || [])
  const [loading, setLoading] = useState(!initialPhotos && !error)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null)
  const [errorMessage, setErrorMessage] = useState(error || '')

  useEffect(() => {
    if (!initialPhotos && !error && token) {
      fetchPhotos()
    }
  }, [token, initialPhotos, error])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/signed-urls?token=${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch photos')
      }

      const data = await response.json()
      setPhotos(data.photos || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const openLightbox = (photo: PhotoData) => {
    setSelectedPhoto(photo)
  }

  const closeLightbox = () => {
    setSelectedPhoto(null)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id)
    let newIndex
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
    }
    
    setSelectedPhoto(photos[newIndex])
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return
      
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          navigatePhoto('prev')
          break
        case 'ArrowRight':
          navigatePhoto('next')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto, photos])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold text-lg mb-2">Access Denied</h2>
            <p>{errorMessage}</p>
          </div>
          <p className="text-gray-600 text-sm">
            This preview link may have expired or is invalid.
          </p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-gray-600">No photos found in this preview.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Photo Preview
          </h1>
          <p className="text-gray-600">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="photo-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="photo-item cursor-pointer"
              onClick={() => openLightbox(photo)}
            >
              <Image
                src={photo.signedUrl}
                alt={photo.caption || 'Photo'}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={selectedPhoto.signedUrl}
                alt={selectedPhoto.caption || 'Photo'}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Caption */}
            {selectedPhoto.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded">
                <p className="text-center">{selectedPhoto.caption}</p>
                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {selectedPhoto.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.params as { token: string }

  try {
    // Use local API route for development, Netlify function for production
    const baseUrl = process.env.NETLIFY_URL || process.env.URL || 'http://localhost:3000'
    const apiPath = process.env.NETLIFY_URL ? '/.netlify/functions/signed-urls' : '/api/signed-urls'
    const response = await fetch(`${baseUrl}${apiPath}?token=${token}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      return {
        props: {
          error: errorData.error || 'Failed to fetch photos'
        }
      }
    }

    const data = await response.json()
    
    return {
      props: {
        initialPhotos: data.photos || []
      }
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      props: {
        error: 'Failed to load photos'
      }
    }
  }
}