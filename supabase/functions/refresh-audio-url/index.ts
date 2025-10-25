
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID } from '../_shared/validation.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const { notebookId } = await req.json()

    if (!notebookId || !isValidUUID(notebookId)) {
      return createCorsResponse(
        { error: 'Valid notebookId (UUID) is required' },
        400,
        origin
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current notebook to find the audio file path
    const { data: notebook, error: fetchError } = await supabase
      .from('notebooks')
      .select('audio_overview_url')
      .eq('id', notebookId)
      .single()

    if (fetchError) {
      console.error('Error fetching notebook:', fetchError)
      return createCorsResponse(
        { error: 'Failed to fetch notebook' },
        404,
        origin
      );
    }

    if (!notebook.audio_overview_url) {
      return createCorsResponse(
        { error: 'No audio overview URL found' },
        404,
        origin
      );
    }

    // Extract the file path from the existing URL
    // Assuming the URL format is similar to: .../storage/v1/object/sign/bucket/path
    const urlParts = notebook.audio_overview_url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === 'audio')
    
    if (bucketIndex === -1) {
      return createCorsResponse(
        { error: 'Invalid audio URL format' },
        400,
        origin
      );
    }

    // Reconstruct the file path from the URL
    const filePath = urlParts.slice(bucketIndex + 1).join('/')

    console.log('Refreshing signed URL for notebook:', notebookId);

    // Generate a new signed URL with 24 hours expiration
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from('audio')
      .createSignedUrl(filePath, 86400) // 24 hours in seconds

    if (signError) {
      console.error('Error creating signed URL:', signError)
      return createCorsResponse(
        { error: 'Failed to create signed URL' },
        500,
        origin
      );
    }

    // Calculate new expiry time (24 hours from now)
    const newExpiryTime = new Date()
    newExpiryTime.setHours(newExpiryTime.getHours() + 24)

    // Update the notebook with the new signed URL and expiry time
    const { error: updateError } = await supabase
      .from('notebooks')
      .update({
        audio_overview_url: signedUrlData.signedUrl,
        audio_url_expires_at: newExpiryTime.toISOString()
      })
      .eq('id', notebookId)

    if (updateError) {
      console.error('Error updating notebook:', updateError)
      return createCorsResponse(
        { error: 'Failed to update notebook with new URL' },
        500,
        origin
      );
    }

    console.log('Successfully refreshed audio URL for notebook:', notebookId)

    return createCorsResponse({ 
      success: true,
      audioUrl: signedUrlData.signedUrl,
      expiresAt: newExpiryTime.toISOString()
    }, 200, origin);

  } catch (error) {
    console.error('Error in refresh-audio-url function:', error)
    return createCorsResponse({ 
      error: error.message || 'Failed to refresh audio URL'
    }, 500, origin);
  }
})
