
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, isValidSourceType } from '../_shared/validation.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const { notebookId, filePath, sourceType } = await req.json()

    if (!notebookId || !isValidUUID(notebookId)) {
      return createCorsResponse(
        { error: 'Valid notebookId (UUID) is required' },
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

    console.log('Processing request:', { notebookId, sourceType });

    // Get environment variables
    const webServiceUrl = Deno.env.get('NOTEBOOK_GENERATION_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!webServiceUrl || !authHeader) {
      console.error('Missing environment variables:', {
        hasUrl: !!webServiceUrl,
        hasAuth: !!authHeader
      })
      
      return createCorsResponse(
        { error: 'Web service configuration missing' },
        500,
        origin
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update notebook status to 'generating'
    await supabaseClient
      .from('notebooks')
      .update({ generation_status: 'generating' })
      .eq('id', notebookId)

    console.log('Calling external web service...')

    // Prepare payload based on source type
    let payload: any = {
      sourceType: sourceType
    };

    if (filePath) {
      payload.filePath = filePath;
    } else {
      // For text sources, get content from database
      const { data: source } = await supabaseClient
        .from('sources')
        .select('content')
        .eq('notebook_id', notebookId)
        .single();
      
      if (source?.content) {
        payload.content = source.content.substring(0, 5000); // Limit content size
      }
    }

    console.log('Sending payload to web service');

    // Call external web service
    const response = await fetch(webServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      console.error('Web service error:', response.status, response.statusText)
      
      await supabaseClient
        .from('notebooks')
        .update({ generation_status: 'failed' })
        .eq('id', notebookId)

      return createCorsResponse(
        { error: 'Failed to generate content from web service' },
        500,
        origin
      );
    }

    const generatedData = await response.json()
    console.log('Generated data received')

    // Parse the response format
    let title, description, notebookIcon, backgroundColor, exampleQuestions;
    
    if (generatedData && generatedData.output) {
      const output = generatedData.output;
      title = output.title;
      description = output.summary;
      notebookIcon = output.notebook_icon;
      backgroundColor = output.background_color;
      exampleQuestions = output.example_questions || [];
    } else {
      console.error('Unexpected response format')
      
      await supabaseClient
        .from('notebooks')
        .update({ generation_status: 'failed' })
        .eq('id', notebookId)

      return createCorsResponse(
        { error: 'Invalid response format from web service' },
        500,
        origin
      );
    }

    if (!title) {
      console.error('No title returned from web service')
      
      await supabaseClient
        .from('notebooks')
        .update({ generation_status: 'failed' })
        .eq('id', notebookId)

      return createCorsResponse(
        { error: 'No title in response from web service' },
        500,
        origin
      );
    }

    // Update notebook with generated content
    const { error: notebookError } = await supabaseClient
      .from('notebooks')
      .update({
        title: title,
        description: description || null,
        icon: notebookIcon || '📝',
        color: backgroundColor || 'bg-gray-100',
        example_questions: exampleQuestions || [],
        generation_status: 'completed'
      })
      .eq('id', notebookId)

    if (notebookError) {
      console.error('Notebook update error:', notebookError)
      return createCorsResponse(
        { error: 'Failed to update notebook' },
        500,
        origin
      );
    }

    console.log('Successfully updated notebook')

    return createCorsResponse({ 
      success: true, 
      title, 
      description,
      icon: notebookIcon,
      color: backgroundColor,
      exampleQuestions,
      message: 'Notebook content generated successfully' 
    }, 200, origin);

  } catch (error) {
    console.error('Edge function error:', error)
    return createCorsResponse(
      { error: 'Internal server error' },
      500,
      origin
    );
  }
})
