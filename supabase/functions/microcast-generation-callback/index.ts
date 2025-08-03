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
    const body = await req.json()
    console.log('Microcast generation callback received:', body)

    const { microcast_id, status, audio_url, title, error_message } = body

    if (!microcast_id) {
      return new Response(
        JSON.stringify({ error: 'Microcast ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the microcast exists
    const { data: microcast, error: fetchError } = await supabase
      .from('microcasts')
      .select('id, user_id, title')
      .eq('id', microcast_id)
      .single()

    if (fetchError || !microcast) {
      console.error('Error fetching microcast:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Microcast not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing callback for microcast:', microcast.title)

    if (status === 'completed' && audio_url) {
      console.log('Microcast generation completed successfully')
      
      // Generate signed URL for the audio file
      const audioFilePath = `microcasts/${microcast_id}/audio.mp3`
      const expiresIn = 60 * 60 * 24 * 7 // 7 days in seconds
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('audio')
        .createSignedUrl(audioFilePath, expiresIn)

      const updateData: any = {
        generation_status: 'completed',
        audio_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
      }

      // Include title if provided by N8N
      if (title && title.trim()) {
        updateData.title = title.trim()
      }

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError)
        // Update with the direct URL if signed URL creation fails
        updateData.audio_url = audio_url
        await supabase
          .from('microcasts')
          .update(updateData)
          .eq('id', microcast_id)
      } else {
        console.log('Signed URL created successfully')
        // Update with the signed URL
        updateData.audio_url = signedUrlData.signedUrl
        await supabase
          .from('microcasts')
          .update(updateData)
          .eq('id', microcast_id)
      }

    } else if (status === 'failed') {
      console.log('Microcast generation failed:', error_message)
      
      // Update status to failed
      await supabase
        .from('microcasts')
        .update({
          generation_status: 'failed'
        })
        .eq('id', microcast_id)

    } else if (status === 'processing') {
      console.log('Microcast generation in progress')
      
      const updateData: any = {
        generation_status: 'processing'
      }

      // Include title if provided by N8N during processing
      if (title && title.trim()) {
        updateData.title = title.trim()
      }
      
      // Update status to processing (if it's not already)
      await supabase
        .from('microcasts')
        .update(updateData)
        .eq('id', microcast_id)

    } else {
      console.log('Unknown status received:', status)
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Callback processed successfully',
        microcast_id: microcast_id,
        status: status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in microcast-generation-callback:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process callback' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})