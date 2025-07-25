import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface UserCategory {
  id?: string;
  name: string;
  color?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const method = req.method;
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('id');

    switch (method) {
      case 'GET':
        // Get all categories for the user
        const { data: categories, error: getError } = await supabaseClient
          .from('user_categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (getError) {
          console.error('Error fetching categories:', getError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch categories' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ categories }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )

      case 'POST':
        // Create a new category
        const createData: UserCategory = await req.json();
        
        if (!createData.name || createData.name.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Category name is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data: newCategory, error: createError } = await supabaseClient
          .from('user_categories')
          .insert({
            user_id: user.id,
            name: createData.name.trim(),
            color: createData.color || '#6B7280'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
          return new Response(
            JSON.stringify({ 
              error: createError.code === '23505' 
                ? 'Category name already exists' 
                : 'Failed to create category' 
            }),
            {
              status: createError.code === '23505' ? 409 : 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ category: newCategory }),
          {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )

      case 'PUT':
        // Update an existing category
        if (!categoryId) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const updateData: UserCategory = await req.json();
        
        if (!updateData.name || updateData.name.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: 'Category name is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data: updatedCategory, error: updateError } = await supabaseClient
          .from('user_categories')
          .update({
            name: updateData.name.trim(),
            color: updateData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating category:', updateError);
          return new Response(
            JSON.stringify({ 
              error: updateError.code === '23505' 
                ? 'Category name already exists' 
                : 'Failed to update category' 
            }),
            {
              status: updateError.code === '23505' ? 409 : 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ category: updatedCategory }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )

      case 'DELETE':
        // Delete a category
        if (!categoryId) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        // First, check if category is being used by any sources
        const { data: sourcesUsingCategory, error: checkError } = await supabaseClient
          .from('sources')
          .select('id')
          .eq('user_id', user.id)
          .contains('category', [categoryId]);

        if (checkError) {
          console.error('Error checking category usage:', checkError);
          return new Response(
            JSON.stringify({ error: 'Failed to check category usage' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        if (sourcesUsingCategory && sourcesUsingCategory.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Cannot delete category that is being used by sources',
              sources_count: sourcesUsingCategory.length
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('user_categories')
          .delete()
          .eq('id', categoryId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting category:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Failed to delete category' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Category deleted successfully' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 