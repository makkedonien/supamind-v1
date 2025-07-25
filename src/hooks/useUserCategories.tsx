import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  color?: string;
}

export const useUserCategories = () => {
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch all user categories
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch categories');
      }

      const result = await response.json();
      setCategories(result.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new category
  const createCategory = async (data: CreateCategoryData): Promise<UserCategory | null> => {
    try {
      setIsCreating(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      const result = await response.json();
      const newCategory = result.category;
      
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: "Success",
        description: `Category "${newCategory.name}" created successfully.`,
      });

      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Update an existing category
  const updateCategory = async (id: string, data: UpdateCategoryData): Promise<UserCategory | null> => {
    try {
      setIsUpdating(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-categories?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      const result = await response.json();
      const updatedCategory = result.category;
      
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      
      toast({
        title: "Success",
        description: `Category "${updatedCategory.name}" updated successfully.`,
      });

      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a category
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      const categoryToDelete = categories.find(cat => cat.id === id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: "Success",
        description: `Category "${categoryToDelete?.name}" deleted successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  // Get category by name
  const getCategoryByName = (name: string): UserCategory | undefined => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  // Get category by ID
  const getCategoryById = (id: string): UserCategory | undefined => {
    return categories.find(cat => cat.id === id);
  };

  // Check if category name exists
  const categoryNameExists = (name: string, excludeId?: string): boolean => {
    return categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && 
      cat.id !== excludeId
    );
  };

  // Initialize categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryByName,
    getCategoryById,
    categoryNameExists,
  };
}; 