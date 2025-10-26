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
    const { microcastId, sourceIds } = await req.json()
    
    if (!microcastId || !isValidUUID(microcastId)) {
      return createCorsResponse(
        { error: 'Valid microcastId (UUID) is required' },
        400,
        origin
      );
    }

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return createCorsResponse(
        { error: 'sourceIds array is required and must not be empty' },
        400,
        origin
      );
    }

    // Validate all source IDs are UUIDs
    for (const sourceId of sourceIds) {
      if (!isValidUUID(sourceId)) {
        return createCorsResponse(
          { error: `Invalid source ID: ${sourceId}` },
          400,
          origin
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the microcast exists and get user info
    const { data: microcast, error: microcastError } = await supabase
      .from('microcasts')
      .select('id, user_id')
      .eq('id', microcastId)
      .single()

    if (microcastError || !microcast) {
      console.error('Error fetching microcast:', microcastError)
      return createCorsResponse(
        { error: 'Microcast not found' },
        404,
        origin
      );
    }

    // Apply HIGH_COST rate limit (20 req/hour)
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.HIGH_COST, microcast.user_id);
    if (rateLimitError) return rateLimitError;

    // Update microcast status to indicate generation has started
    const { error: updateError } = await supabase
      .from('microcasts')
      .update({
        generation_status: 'generating'
      })
      .eq('id', microcastId)

    if (updateError) {
      console.error('Error updating microcast status:', updateError)
      throw updateError
    }

    // Get microcast generation webhook URL and auth from secrets
    const microcastGenerationWebhookUrl = Deno.env.get('MICROCAST_GENERATION_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!microcastGenerationWebhookUrl || !authHeader) {
      console.error('Missing microcast generation webhook URL or auth')
      return createCorsResponse(
        { error: 'Microcast generation service not configured' },
        500,
        origin
      );
    }

    console.log('Starting microcast generation for:', microcastId, 'with', sourceIds.length, 'sources');

    // Start the background task without awaiting
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Call the external microcast generation webhook
          const microcastResponse = await fetch(microcastGenerationWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({
              microcast_id: microcastId,
              source_ids: sourceIds,
              user_id: microcast.user_id,
              callback_url: `${supabaseUrl}/functions/v1/microcast-generation-callback`
            })
          })

          if (!microcastResponse.ok) {
            const errorText = await microcastResponse.text()
            console.error('Microcast generation webhook failed:', errorText)
            
            // Update status to failed
            await supabase
              .from('microcasts')
              .update({ generation_status: 'failed' })
              .eq('id', microcastId)
          } else {
            console.log('Microcast generation webhook called successfully for microcast:', microcastId)
          }
        } catch (error) {
          console.error('Background microcast generation error:', error)
          
          // Update status to failed
          await supabase
            .from('microcasts')
            .update({ generation_status: 'failed' })
            .eq('id', microcastId)
        }
      })()
    )

    // Return immediately with success status
    return createCorsResponse({
      success: true,
      message: 'Microcast generation started',
      microcastId: microcastId,
      status: 'generating'
    }, 200, origin);

  } catch (error) {
    console.error('Error in generate-microcast:', error)
    return createCorsResponse({ 
      error: error.message || 'Failed to start microcast generation' 
    }, 500, origin);
  }
})