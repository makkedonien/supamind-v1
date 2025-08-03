import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { microcastId, sourceIds } = await req.json()
    
    if (!microcastId || !sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Microcast ID and source IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: 'Microcast not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      return new Response(
        JSON.stringify({ error: 'Microcast generation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting microcast generation for:', microcastId, 'with sources:', sourceIds)

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
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Microcast generation started',
        microcastId: microcastId,
        status: 'generating'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-microcast:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to start microcast generation' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})