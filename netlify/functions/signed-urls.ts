import { Handler } from '@netlify/functions'
import { supabaseAdmin } from '../../lib/supabaseServer'

interface PhotoData {
  id: string
  caption: string | null
  tags: string[] | null
  signedUrl: string
}

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const token = event.queryStringParameters?.token

  if (!token) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Token is required' }),
    }
  }

  try {
    // Validate token and check expiry
    const { data: preview, error: previewError } = await supabaseAdmin
      .from('previews')
      .select('*')
      .eq('token', token)
      .single()

    if (previewError || !preview) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired preview token' }),
      }
    }

    // Check if token has expired
    if (preview.expires_at && new Date(preview.expires_at) < new Date()) {
      return {
        statusCode: 410,
        headers,
        body: JSON.stringify({ error: 'Preview token has expired' }),
      }
    }

    // Fetch photos for this feed
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('feed_id', preview.feed_id)
      .order('order_index', { ascending: true })

    if (photosError) {
      console.error('Error fetching photos:', photosError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch photos' }),
      }
    }

    // Generate signed URLs for each photo (1 hour expiry)
    const photosWithSignedUrls: PhotoData[] = await Promise.all(
      photos.map(async (photo) => {
        try {
          const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600) // 1 hour

          if (urlError) {
            console.error('Error creating signed URL for photo:', photo.id, urlError)
            throw urlError
          }

          return {
            id: photo.id,
            caption: photo.caption,
            tags: photo.tags,
            signedUrl: signedUrlData.signedUrl,
          }
        } catch (error) {
          console.error('Error processing photo:', photo.id, error)
          // Return photo without signed URL rather than failing completely
          return {
            id: photo.id,
            caption: photo.caption,
            tags: photo.tags,
            signedUrl: '',
          }
        }
      })
    )

    // Filter out photos without signed URLs
    const validPhotos = photosWithSignedUrls.filter(photo => photo.signedUrl)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        photos: validPhotos,
        total: validPhotos.length,
      }),
    }
  } catch (error) {
    console.error('Unexpected error in signed-urls function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}