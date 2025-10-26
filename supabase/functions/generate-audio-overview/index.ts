
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID } from '../_shared/validation.ts'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get notebook to retrieve user_id for rate limiting
    const { data: notebook, error: fetchError } = await supabase
      .from('notebooks')
      .select('user_id')
      .eq('id', notebookId)
      .single()

    if (fetchError || !notebook) {
      console.error('Error fetching notebook:', fetchError)
      return createCorsResponse(
        { error: 'Notebook not found' },
        404,
        origin
      );
    }

    // Apply HIGH_COST rate limit (20 req/hour)
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.HIGH_COST, notebook.user_id);
    if (rateLimitError) return rateLimitError;

    // Update notebook status to indicate audio generation has started
    const { error: updateError } = await supabase
      .from('notebooks')
      .update({
        audio_overview_generation_status: 'generating'
      })
      .eq('id', notebookId)

    if (updateError) {
      console.error('Error updating notebook status:', updateError)
      throw updateError
    }

    // Get audio generation webhook URL and auth from secrets
    const audioGenerationWebhookUrl = Deno.env.get('AUDIO_GENERATION_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!audioGenerationWebhookUrl || !authHeader) {
      console.error('Missing audio generation webhook URL or auth')
      return createCorsResponse(
        { error: 'Audio generation service not configured' },
        500,
        origin
      );
    }

    console.log('Starting audio overview generation for notebook:', notebookId)

    // Start the background task without awaiting
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Call the external audio generation webhook
          const audioResponse = await fetch(audioGenerationWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              notebook_id: notebookId,
              callback_url: `${supabaseUrl}/functions/v1/audio-generation-callback`
            })
          })

          if (!audioResponse.ok) {
            const errorText = await audioResponse.text()
            console.error('Audio generation webhook failed:', errorText)
            
            // Update status to failed
            await supabase
              .from('notebooks')
              .update({ audio_overview_generation_status: 'failed' })
              .eq('id', notebookId)
          } else {
            console.log('Audio generation webhook called successfully for notebook:', notebookId)
          }
        } catch (error) {
          console.error('Background audio generation error:', error)
          
          // Update status to failed
          await supabase
            .from('notebooks')
            .update({ audio_overview_generation_status: 'failed' })
            .eq('id', notebookId)
        }
      })()
    )

    // Return immediately with success status
    return createCorsResponse({
      success: true,
      message: 'Audio generation started',
      status: 'generating'
    }, 200, origin);

  } catch (error) {
    console.error('Error in generate-audio-overview:', error)
    return createCorsResponse({ 
      error: error.message || 'Failed to start audio generation' 
    }, 500, origin);
  }
})
