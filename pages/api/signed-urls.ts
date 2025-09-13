import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { token } = req.query

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Token is required' })
    return
  }

  try {
    // Validate the preview token
    const { data: preview, error: previewError } = await supabase
      .from('previews')
      .select('feed_id, expires_at')
      .eq('token', token)
      .single()

    if (previewError || !preview) {
      res.status(404).json({ error: 'Invalid or expired preview link' })
      return
    }

    // Check if token has expired
    if (preview.expires_at && new Date(preview.expires_at) < new Date()) {
      res.status(404).json({ error: 'Preview link has expired' })
      return
    }

    // Fetch photos for this feed
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, caption, tags, storage_path')
      .eq('feed_id', preview.feed_id)
      .order('order_index', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      res.status(500).json({ error: 'Failed to fetch photos' })
      return
    }

    // Generate signed URLs for each photo
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        try {
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600) // 1 hour expiry

          if (urlError || !signedUrlData?.signedUrl) {
            console.error('Error creating signed URL for photo:', photo.id, urlError)
            return null
          }

          return {
            id: photo.id,
            caption: photo.caption,
            tags: photo.tags,
            signedUrl: signedUrlData.signedUrl
          }
        } catch (error) {
          console.error('Error processing photo:', photo.id, error)
          return null
        }
      })
    )

    // Filter out any failed photo processing
    const validPhotos = photosWithUrls.filter(photo => photo !== null)

    res.status(200).json({ photos: validPhotos })
  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}