import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, sanitizeString } from '../_shared/validation.ts'

interface UserCategory {
  id?: string;
  name: string;
  color?: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return createCorsResponse(
        { error: 'Missing authorization header' },
        401,
        origin
      );
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
      return createCorsResponse(
        { error: 'Unauthorized' },
        401,
        origin
      );
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
          return createCorsResponse(
            { error: 'Failed to fetch categories' },
            500,
            origin
          );
        }

        return createCorsResponse({ categories }, 200, origin);

      case 'POST':
        // Create a new category
        const createData: UserCategory = await req.json();
        
        if (!createData.name || createData.name.trim().length === 0) {
          return createCorsResponse(
            { error: 'Category name is required' },
            400,
            origin
          );
        }

        const sanitizedName = sanitizeString(createData.name, 100);

        const { data: newCategory, error: createError } = await supabaseClient
          .from('user_categories')
          .insert({
            user_id: user.id,
            name: sanitizedName,
            color: createData.color || '#6B7280'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
          return createCorsResponse({ 
            error: createError.code === '23505' 
              ? 'Category name already exists' 
              : 'Failed to create category' 
          }, createError.code === '23505' ? 409 : 500, origin);
        }

        return createCorsResponse({ category: newCategory }, 201, origin);

      case 'PUT':
        // Update an existing category
        if (!categoryId || !isValidUUID(categoryId)) {
          return createCorsResponse(
            { error: 'Valid category ID is required' },
            400,
            origin
          );
        }

        const updateData: UserCategory = await req.json();
        
        if (!updateData.name || updateData.name.trim().length === 0) {
          return createCorsResponse(
            { error: 'Category name is required' },
            400,
            origin
          );
        }

        const sanitizedUpdateName = sanitizeString(updateData.name, 100);

        const { data: updatedCategory, error: updateError } = await supabaseClient
          .from('user_categories')
          .update({
            name: sanitizedUpdateName,
            color: updateData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', categoryId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating category:', updateError);
          return createCorsResponse({ 
            error: updateError.code === '23505' 
              ? 'Category name already exists' 
              : 'Failed to update category' 
          }, updateError.code === '23505' ? 409 : 500, origin);
        }

        return createCorsResponse({ category: updatedCategory }, 200, origin);

      case 'DELETE':
        // Delete a category
        if (!categoryId || !isValidUUID(categoryId)) {
          return createCorsResponse(
            { error: 'Valid category ID is required' },
            400,
            origin
          );
        }

        // First, check if category is being used by any sources
        const { data: sourcesUsingCategory, error: checkError } = await supabaseClient
          .from('sources')
          .select('id')
          .eq('user_id', user.id)
          .contains('category', [categoryId]);

        if (checkError) {
          console.error('Error checking category usage:', checkError);
          return createCorsResponse(
            { error: 'Failed to check category usage' },
            500,
            origin
          );
        }

        if (sourcesUsingCategory && sourcesUsingCategory.length > 0) {
          return createCorsResponse({ 
            error: 'Cannot delete category that is being used by sources',
            sources_count: sourcesUsingCategory.length
          }, 409, origin);
        }

        const { error: deleteError } = await supabaseClient
          .from('user_categories')
          .delete()
          .eq('id', categoryId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('Error deleting category:', deleteError);
          return createCorsResponse(
            { error: 'Failed to delete category' },
            500,
            origin
          );
        }

        return createCorsResponse({ message: 'Category deleted successfully' }, 200, origin);

      default:
        return createCorsResponse(
          { error: 'Method not allowed' },
          405,
          origin
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return createCorsResponse(
      { error: 'Internal server error' },
      500,
      origin
    );
  }
}) 