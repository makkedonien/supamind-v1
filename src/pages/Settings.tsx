import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { useUserCategories } from '@/hooks/useUserCategories';

const Settings = () => {
  const { user } = useAuth();
  const { 
    categories, 
    isLoading: categoriesLoading, 
    isCreating,
    isDeleting,
    createCategory, 
    deleteCategory,
    categoryNameExists 
  } = useUserCategories();
  
  // Form state
  const [name, setName] = useState(user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newCategory, setNewCategory] = useState('');
  const [aiSummaryPrompt, setAiSummaryPrompt] = useState('');
  const [aiDeepSummaryPrompt, setAiDeepSummaryPrompt] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleAddCategory = async () => {
    if (newCategory.trim() && 
        categories.length < 10 && 
        !categoryNameExists(newCategory.trim())) {
      const result = await createCategory({ name: newCategory.trim() });
      if (result) {
        setNewCategory('');
      }
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleSaveChanges = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', {
      name,
      email,
      categories,
      aiSummaryPrompt,
      aiDeepSummaryPrompt,
      isDarkMode
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Account</CardTitle>
            <CardDescription>
              Update your account information and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Reset Password
              </Button>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">App</CardTitle>
            <CardDescription>
              Configure your application preferences and AI settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Categories Management */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Categories Management</Label>
                <p className="text-sm text-muted-foreground">
                  Add up to 10 categories to organize your content.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a category..."
                  className="flex-1"
                  disabled={categories.length >= 10}
                />
                <Button 
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || categories.length >= 10 || categoryNameExists(newCategory.trim()) || isCreating}
                  size="icon"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading categories...
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge 
                        key={category.id} 
                        variant="secondary" 
                        className="flex items-center gap-1"
                        style={{ backgroundColor: category.color + '20', borderColor: category.color }}
                      >
                        {category.name}
                        <button
                          onClick={() => handleRemoveCategory(category.id)}
                          disabled={isDeleting}
                          className="ml-1 hover:text-destructive disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {categories.length}/10 categories used
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* AI Prompts */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-summary">AI Summary Prompt</Label>
                <p className="text-sm text-muted-foreground">
                  Customize how the AI generates content summaries.
                </p>
                <Textarea
                  id="ai-summary"
                  value={aiSummaryPrompt}
                  onChange={(e) => setAiSummaryPrompt(e.target.value)}
                  placeholder="Enter your custom AI summary prompt..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ai-deep-summary">AI Deep Summary Prompt</Label>
                <p className="text-sm text-muted-foreground">
                  Customize how the AI generates detailed content analysis.
                </p>
                <Textarea
                  id="ai-deep-summary"
                  value={aiDeepSummaryPrompt}
                  onChange={(e) => setAiDeepSummaryPrompt(e.target.value)}
                  placeholder="Enter your custom AI deep summary prompt..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Display</CardTitle>
            <CardDescription>
              Customize the appearance and behavior of the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dark-mode" className="text-base font-medium">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark theme.
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 