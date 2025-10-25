
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { sanitizeString } from '../_shared/validation.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const { content } = await req.json();

    if (!content) {
      return createCorsResponse(
        { error: 'Content is required' },
        400,
        origin
      );
    }

    // Parse content if it's a structured AI response
    let textContent = content;
    try {
      const parsed = JSON.parse(content);
      if (parsed.segments && parsed.segments.length > 0) {
        // Extract text from first few segments
        textContent = parsed.segments
          .slice(0, 3)
          .map((segment: any) => segment.text)
          .join(' ');
      }
    } catch (e) {
      // Content is already plain text
    }

    // Sanitize and truncate content to avoid token limits
    const sanitizedContent = sanitizeString(textContent, 1000);

    if (!openAIApiKey) {
      return createCorsResponse(
        { error: 'OpenAI API key not configured' },
        500,
        origin
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that generates concise, descriptive titles. Generate a title that is exactly 5 words or fewer, capturing the main topic or theme of the content. Return only the title, nothing else.' 
          },
          { 
            role: 'user', 
            content: `Generate a 5-word title for this content: ${sanitizedContent}` 
          }
        ],
        max_tokens: 20,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      return createCorsResponse(
        { error: `OpenAI API error: ${response.status}` },
        500,
        origin
      );
    }

    const data = await response.json();
    const generatedTitle = data.choices[0].message.content.trim();

    console.log('Generated title successfully');

    return createCorsResponse({ title: generatedTitle }, 200, origin);

  } catch (error) {
    console.error('Error in generate-note-title function:', error);
    return createCorsResponse(
      { error: error.message },
      500,
      origin
    );
  }
});
