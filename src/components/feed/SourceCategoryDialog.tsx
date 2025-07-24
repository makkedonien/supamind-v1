import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tag, Plus, X, Check } from 'lucide-react';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useToast } from '@/hooks/use-toast';

interface FeedSource {
  id: string;
  title: string;
  category?: string[];
}

interface SourceCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: FeedSource | null;
}

// Predefined categories that users can choose from
const PREDEFINED_CATEGORIES = [
  'Technology',
  'Business',
  'Science',
  'Health',
  'Education',
  'Entertainment',
  'Sports',
  'Politics',
  'Finance',
  'Marketing',
  'Design',
  'Research',
  'News',
  'Documentation',
  'Tutorial',
  'Analysis',
  'Report',
  'Opinion',
  'Review',
  'Guide'
];

const SourceCategoryDialog = ({ open, onOpenChange, source }: SourceCategoryDialogProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { updateSourceAsync } = useFeedSources();
  const { toast } = useToast();

  // Initialize categories when source changes
  useEffect(() => {
    if (source) {
      setSelectedCategories(source.category || []);
    } else {
      setSelectedCategories([]);
    }
  }, [source]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setNewCategory('');
      setSelectedCategories([]);
    }
  }, [open]);

  const handleAddCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory && !selectedCategories.includes(trimmedCategory)) {
      setSelectedCategories([...selectedCategories, trimmedCategory]);
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== categoryToRemove));
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      handleAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNewCategory();
    }
  };

  const handleSave = async () => {
    if (!source) return;

    setIsSaving(true);
    try {
      await updateSourceAsync({
        sourceId: source.id,
        updates: {
          metadata: {
            ...(source as any).metadata,
            categoriesUpdated: true
          }
        }
      });

      // Update the categories - we need to use a separate call for the category field
      await updateSourceAsync({
        sourceId: source.id,
        updates: {
          category: selectedCategories
        }
      });

      toast({
        title: "Categories updated",
        description: `Categories for "${source.title}" have been updated.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating source categories:', error);
      toast({
        title: "Error",
        description: "Failed to update categories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get suggested categories that aren't already selected
  const suggestedCategories = PREDEFINED_CATEGORIES.filter(
    cat => !selectedCategories.includes(cat)
  );

  if (!source) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <span>Manage Categories</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-sm text-gray-900">{source.title}</p>
            <p className="text-xs text-gray-600 mt-1">Organizing your sources helps you find them easier later.</p>
          </div>

          {/* Selected Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Selected Categories</Label>
            {selectedCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <Badge 
                    key={category} 
                    variant="default" 
                    className="px-3 py-1 flex items-center space-x-1"
                  >
                    <span>{category}</span>
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No categories selected</p>
            )}
          </div>

          {/* Add New Category */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Custom Category</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleAddNewCategory}
                disabled={!newCategory.trim()}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Suggested Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Suggested Categories</Label>
            <ScrollArea className="h-32">
              <div className="flex flex-wrap gap-2">
                {suggestedCategories.map((category) => (
                  <Badge 
                    key={category}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100 px-3 py-1 flex items-center space-x-1"
                    onClick={() => handleAddCategory(category)}
                  >
                    <span>{category}</span>
                    <Plus className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Check className="h-4 w-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Categories
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SourceCategoryDialog; 