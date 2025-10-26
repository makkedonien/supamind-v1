
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyHmacSignature } from '../_shared/webhook-security.ts'
import { isValidUUID } from '../_shared/validation.ts'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../_shared/rate-limit.ts'

// No CORS headers needed for server-to-server callback
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204 })
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    let payload;
    
    if (webhookSecret) {
      // Verify HMAC signature if secret is configured
      const signature = req.headers.get('x-webhook-signature');
      
      if (!signature) {
        console.error('Missing webhook signature');
        return new Response(
          JSON.stringify({ error: 'Missing webhook signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.text();
      const isValid = await verifyHmacSignature(body, signature, webhookSecret);
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      payload = JSON.parse(body);
      console.log('Audio generation callback received and verified');
    } else {
      // Fallback for existing deployments without webhook secret configured
      console.warn('WEBHOOK_SECRET not configured - callback authentication disabled');
      payload = await req.json();
      console.log('Audio generation callback received (unverified)');
    }
    
    const { notebook_id, audio_url, status, error } = payload;
    
    if (!notebook_id || !isValidUUID(notebook_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid notebook_id (UUID) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Apply CALLBACK rate limit (500 req/hour) - use notebook_id as identifier
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.CALLBACK, notebook_id);
    if (rateLimitError) return rateLimitError;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (status === 'success' && audio_url) {
      // Set expiration time (24 hours from now)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Update notebook with audio URL and success status
      const { error: updateError } = await supabase
        .from('notebooks')
        .update({
          audio_overview_url: audio_url,
          audio_url_expires_at: expiresAt.toISOString(),
          audio_overview_generation_status: 'completed'
        })
        .eq('id', notebook_id)

      if (updateError) {
        console.error('Error updating notebook with audio URL:', updateError)
        throw updateError
      }

      console.log('Audio overview completed successfully')
    } else {
      // Update notebook with failed status
      const { error: updateError } = await supabase
        .from('notebooks')
        .update({
          audio_overview_generation_status: 'failed'
        })
        .eq('id', notebook_id)

      if (updateError) {
        console.error('Error updating notebook status to failed:', updateError)
        throw updateError
      }

      console.log('Audio generation failed:', error || 'Unknown error')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in audio-generation-callback:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process callback' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
