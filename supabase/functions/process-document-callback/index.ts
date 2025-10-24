
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyHmacSignature } from '../_shared/webhook-security.ts'
import { isValidUUID } from '../_shared/validation.ts'

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
      console.log('Document processing callback received and verified');
    } else {
      // Fallback for existing deployments without webhook secret configured
      console.warn('WEBHOOK_SECRET not configured - callback authentication disabled');
      payload = await req.json();
      console.log('Document processing callback received (unverified)');
    }

    const { source_id, content, summary, display_name, title, status, error, image_url } = payload;

    if (!source_id || !isValidUUID(source_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid source_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Prepare update data
    const updateData: any = {
      processing_status: status || 'completed',
      updated_at: new Date().toISOString()
    }

    if (content) {
      updateData.content = content
    }

    if (summary) {
      updateData.summary = summary
    }

    // Use title if provided, otherwise use display_name, for backward compatibility
    if (title) {
      updateData.title = title
    } else if (display_name) {
      updateData.title = display_name
    }

    // Store image URL if provided (typically from web articles)
    if (image_url) {
      updateData.image_url = image_url
      console.log('Setting image URL for source:', image_url);
    }

    if (error) {
      updateData.processing_status = 'failed'
      console.error('Document processing failed:', error)
    }

    console.log('Updating source with data:', updateData);

    // Update the source record
    const { data, error: updateError } = await supabaseClient
      .from('sources')
      .update(updateData)
      .eq('id', source_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating source:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update source', details: updateError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Source updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Source updated successfully', data }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-document-callback function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
