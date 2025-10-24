
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { validateDocumentProcessing } from '../_shared/validation.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const body = await req.json();

    // Validate input
    const validation = validateDocumentProcessing(body);
    if (!validation.valid) {
      return createCorsResponse(
        { error: 'Validation failed', details: validation.errors },
        400,
        origin
      );
    }

    const { sourceId, filePath, sourceType, userId, notebookId } = body;

    console.log('Processing document:', { source_id: sourceId, source_type: sourceType, user_id: userId, notebook_id: notebookId });

    // Get environment variables
    const webhookUrl = Deno.env.get('DOCUMENT_PROCESSING_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!webhookUrl) {
      console.error('Missing DOCUMENT_PROCESSING_WEBHOOK_URL environment variable')
      
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
        { error: 'Document processing webhook URL not configured' },
        500,
        origin
      )
    }

    console.log('Calling external webhook:', webhookUrl);

    // Create the file URL for public access
    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sources/${filePath}`

    // Prepare the payload for the webhook with correct variable names
    const payload = {
      source_id: sourceId,
      file_url: fileUrl,
      file_path: filePath,
      source_type: sourceType,
      user_id: userId,
      notebook_id: notebookId,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-callback`
    }

    console.log('Webhook payload:', payload);

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
      console.error('Webhook call failed:', response.status, errorText);
      
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
        { error: 'Document processing failed', details: errorText },
        500,
        origin
      )
    }

    const result = await response.json()
    console.log('Webhook response received');

    return createCorsResponse(
      { success: true, message: 'Document processing initiated', result },
      200,
      origin
    )

  } catch (error) {
    console.error('Error in process-document function:', error)
    return createCorsResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
})
