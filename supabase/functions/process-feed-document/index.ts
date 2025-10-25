import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, isValidFilePath, isValidSourceType } from '../_shared/validation.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const { sourceId, filePath, sourceType, userId } = await req.json()

    // Validate inputs
    if (!sourceId || !isValidUUID(sourceId)) {
      return createCorsResponse(
        { error: 'Valid sourceId (UUID) is required' },
        400,
        origin
      );
    }
    
    if (!userId || !isValidUUID(userId)) {
      return createCorsResponse(
        { error: 'Valid userId (UUID) is required' },
        400,
        origin
      );
    }
    
    if (!filePath || !isValidFilePath(filePath)) {
      return createCorsResponse(
        { error: 'Valid filePath is required' },
        400,
        origin
      );
    }
    
    if (!sourceType || !isValidSourceType(sourceType)) {
      return createCorsResponse(
        { error: 'Valid sourceType is required' },
        400,
        origin
      );
    }

    console.log('Processing feed document:', { source_id: sourceId, file_path: filePath, source_type: sourceType, user_id: userId });

    // Get environment variables
    const webhookUrl = Deno.env.get('FEED_DOCUMENT_PROCESSING_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!webhookUrl) {
      console.error('Missing FEED_DOCUMENT_PROCESSING_WEBHOOK_URL environment variable')
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return createCorsResponse(
        { error: 'Feed document processing webhook URL not configured' },
        500,
        origin
      );
    }

    console.log('Calling external feed document processing webhook:', webhookUrl);

    // Create the file URL for public access
    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sources/${filePath}`

    // Prepare the payload for the webhook with feed-specific context
    const payload = {
      source_id: sourceId,
      file_url: fileUrl,
      file_path: filePath,
      source_type: sourceType,
      user_id: userId,
      notebook_id: null, // Explicitly set null for feed sources
      context: 'feed', // Indicate this is for feed processing
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-callback`
    }

    console.log('Feed document webhook payload:', payload);

    // Call external webhook with proper headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Feed document webhook call failed:', response.status, errorText);
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return createCorsResponse(
        { error: 'Feed document processing failed', details: errorText },
        500,
        origin
      );
    }

    const result = await response.json()
    console.log('Feed document webhook response received');

    return createCorsResponse(
      { success: true, message: 'Feed document processing initiated', result },
      200,
      origin
    );

  } catch (error) {
    console.error('Error in process-feed-document function:', error)
    return createCorsResponse(
      { error: 'Internal server error' },
      500,
      origin
    );
  }
}) 