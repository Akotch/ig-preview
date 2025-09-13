import { useState, useEffect } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Database } from '../lib/database.types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { nanoid } from 'nanoid'
import Image from 'next/image'

type Feed = Database['public']['Tables']['feeds']['Row']
type Photo = Database['public']['Tables']['photos']['Row']
type Preview = Database['public']['Tables']['previews']['Row']

interface PhotoWithSignedUrl extends Photo {
  signedUrl?: string
}

function SortablePhoto({ photo, onDelete }: { photo: PhotoWithSignedUrl; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="photo-item relative group"
    >
      {photo.signedUrl && (
        <Image
          src={photo.signedUrl}
          alt={photo.caption || 'Photo'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(photo.id)
        }}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
          {photo.caption}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [photos, setPhotos] = useState<PhotoWithSignedUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('/admin')
  const user = useUser()
  const supabase = useSupabaseClient() as any

  // Set redirect URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/admin`)
    }
  }, [])
  const [feed, setFeed] = useState<Feed | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (user) {
      loadOrCreateFeed()
    }
  }, [user])

  const loadOrCreateFeed = async () => {
    try {
      // Try to get existing feed
      let { data: feeds, error } = await supabase
        .from('feeds')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code === 'PGRST116') {
        // No feed exists, create one
        const { data: newFeed, error: createError } = await supabase
          .from('feeds')
          .insert({ title: 'Draft IG Grid' })
          .select()
          .single()

        if (createError) throw createError
        feeds = newFeed
      } else if (error) {
        throw error
      }

      setFeed(feeds)
      await loadPhotos(feeds.id)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPhotos = async (feedId: string) => {
    try {
      const { data: photosData, error } = await supabase
        .from('photos')
        .select('*')
        .eq('feed_id', feedId)
        .order('order_index', { ascending: true })

      if (error) throw error

      // Get signed URLs for photos
      const photosWithUrls = await Promise.all(
        photosData.map(async (photo: Photo) => {
          const { data: signedUrlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600)

          return {
            ...photo,
            signedUrl: signedUrlData?.signedUrl
          }
        })
      )

      setPhotos(photosWithUrls)
    } catch (error) {
      console.error('Error loading photos:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !feed) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${nanoid()}.${fileExt}`
        const filePath = `${feed.id}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Insert photo record
        const { error: insertError } = await supabase
          .from('photos')
          .insert({
            feed_id: feed.id,
            storage_path: filePath,
            order_index: photos.length
          })

        if (insertError) throw insertError
      }

      await loadPhotos(feed.id)
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = photos.findIndex((photo) => photo.id === active.id)
      const newIndex = photos.findIndex((photo) => photo.id === over?.id)

      const newPhotos = arrayMove(photos, oldIndex, newIndex)
      setPhotos(newPhotos)

      // Update order in database
      try {
        const updates = newPhotos.map((photo, index) => ({
          id: photo.id,
          order_index: index
        }))

        for (const update of updates) {
          await supabase
            .from('photos')
            .update({ order_index: update.order_index })
            .eq('id', update.id)
        }
      } catch (error) {
        console.error('Error updating photo order:', error)
      }
    }
  }

  const deletePhoto = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      // Delete from storage
      await supabase.storage
        .from('photos')
        .remove([photo.storage_path])

      // Delete from database
      await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      setPhotos(photos.filter(p => p.id !== photoId))
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

  const generatePreviewLink = async () => {
    if (!feed) return

    try {
      const token = nanoid()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour from now

      const { error } = await supabase
        .from('previews')
        .insert({
          feed_id: feed.id,
          token,
          expires_at: expiresAt.toISOString()
        })

      if (error) throw error

      const url = `${window.location.origin}/preview/${token}`
      setPreviewUrl(url)
    } catch (error) {
      console.error('Error generating preview link:', error)
      alert('Error generating preview link. Please try again.')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to IG Preview Admin
            </h2>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            redirectTo={redirectUrl}
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              IG Preview Admin - {feed?.title}
            </h1>
            <button
              onClick={signOut}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="input-field"
                />
              </div>
              <button
                onClick={generatePreviewLink}
                disabled={photos.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Preview Link
              </button>
            </div>

            {uploading && (
              <div className="mt-4 text-blue-600">
                Uploading photos...
              </div>
            )}

            {previewUrl && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Preview link generated (expires in 1 hour):
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={previewUrl}
                    readOnly
                    className="flex-1 input-field text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(previewUrl)}
                    className="btn-secondary text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {photos.length > 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Photos ({photos.length})
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={photos.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="photo-grid">
                    {photos.map((photo) => (
                      <SortablePhoto
                        key={photo.id}
                        photo={photo}
                        onDelete={deletePhoto}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No photos uploaded yet. Upload some photos to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}