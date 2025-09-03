import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Trash2, Plus, X, Loader2, Download, Chrome, Mail, Radio } from 'lucide-react';
import { useUserCategories } from '@/hooks/useUserCategories';
import { useProfile } from '@/hooks/useProfile';
import { usePodcasts } from '@/hooks/usePodcasts';

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
  
  const {
    profile,
    isLoading: profileLoading,
    updatePrompts,
    isUpdatingPrompts,
    updateProfile,
    isUpdating
  } = useProfile();
  
  const {
    podcasts,
    isLoading: podcastsLoading,
    isAdding: isAddingPodcast,
    isDeleting: isDeletingPodcast,
    addPodcast,
    deletePodcast,
    rssExists
  } = usePodcasts();
  
  // Form state
  const [name, setName] = useState(user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [transcriptApiKey, setTranscriptApiKey] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [aiSummaryPrompt, setAiSummaryPrompt] = useState('');
  const [aiDeepSummaryPrompt, setAiDeepSummaryPrompt] = useState('');
  const [aiFeedCategorizationPrompt, setAiFeedCategorizationPrompt] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newPodcastRss, setNewPodcastRss] = useState('');
  const [podcastProcessingEnabled, setPodcastProcessingEnabled] = useState(false);

  // Load profile data into form when available
  useEffect(() => {
    if (profile) {
      setAiSummaryPrompt(profile.summary_prompt || '');
      setAiDeepSummaryPrompt(profile.deep_dive_prompt || '');
      setAiFeedCategorizationPrompt(profile.categorization_prompt || '');
      setTranscriptApiKey(profile.transcript_api_key || '');
      setName(profile.full_name || user?.email?.split('@')[0] || '');
      setEmail(profile.email || user?.email || '');
      setPodcastProcessingEnabled(profile.podcast_processing === 'enabled');
    }
  }, [profile, user]);

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

  const handleSaveApiKey = async () => {
    try {
      if (profile && transcriptApiKey !== profile.transcript_api_key) {
        await updateProfile.mutateAsync({
          transcript_api_key: transcriptApiKey.trim() || null,
        });
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handlePodcastProcessingToggle = async (enabled: boolean) => {
    try {
      await updateProfile.mutateAsync({
        podcast_processing: enabled ? 'enabled' : 'disabled',
      });
      setPodcastProcessingEnabled(enabled);
    } catch (error) {
      console.error('Error updating podcast processing setting:', error);
    }
  };

  const handleApiKeyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveApiKey();
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Check if any profile data has changed
      const profileChanges: any = {};
      let hasProfileChanges = false;

      if (profile && name !== profile.full_name) {
        profileChanges.full_name = name.trim() || null;
        hasProfileChanges = true;
      }

      if (profile && transcriptApiKey !== profile.transcript_api_key) {
        profileChanges.transcript_api_key = transcriptApiKey.trim() || null;
        hasProfileChanges = true;
      }

      // Update profile data if there are changes
      if (hasProfileChanges) {
        await updateProfile.mutateAsync(profileChanges);
      }
      
      // Update AI prompts
      await updatePrompts.mutateAsync({
        summary_prompt: aiSummaryPrompt.trim() || null,
        deep_dive_prompt: aiDeepSummaryPrompt.trim() || null,
        categorization_prompt: aiFeedCategorizationPrompt.trim() || null,
      });
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleAddPodcast = async () => {
    if (newPodcastRss.trim() && 
        podcasts.length < 10 && 
        !rssExists(newPodcastRss.trim()) &&
        profile?.transcript_api_key) {
      const result = await addPodcast(newPodcastRss.trim());
      if (result) {
        setNewPodcastRss('');
      }
    }
  };

  const handleRemovePodcast = async (podcastId: string) => {
    await deletePodcast(podcastId);
  };

  const handlePodcastKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPodcast();
    }
  };

  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/supamind_chrome_extension.zip';
    link.download = 'supamind_chrome_extension.zip';
    link.click();
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
                  placeholder="Enter your email"
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this page
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Reset Password
              </Button>
              <Button className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Podcasts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Podcasts
            </CardTitle>
            <CardDescription>
              Add up to 10 podcast RSS feeds to automatically process and sync podcast episodes to your feed. An AssemblyAI API Key is required for podcast transcription. Need help finding a podcast's RSS feed URL? Use this <a href="https://castos.com/tools/find-podcast-rss-feed/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">free RSS feed finder tool</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transcript-api-key">AssemblyAI API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="transcript-api-key"
                  type="password"
                  value={transcriptApiKey}
                  onChange={(e) => setTranscriptApiKey(e.target.value)}
                  onKeyPress={handleApiKeyKeyPress}
                  placeholder="Enter your transcription service API key from AssemblyAI"
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveApiKey}
                  disabled={!transcriptApiKey.trim() || transcriptApiKey === profile?.transcript_api_key || isUpdating}
                  size="default"
                  className="whitespace-nowrap"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save API Key
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required: Generate an API key with AssemblyAI and submit it here. This is required to enable podcast transcription and summary feature.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="podcast-processing" className="text-base font-medium">Enable Podcast Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow automatic processing and transcription of podcast episodes from RSS feeds.
                  </p>
                </div>
                <Switch
                  id="podcast-processing"
                  checked={podcastProcessingEnabled}
                  onCheckedChange={handlePodcastProcessingToggle}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Add Podcast Feed</Label>
                <p className="text-sm text-muted-foreground">
                  Enter the RSS feed URL of a podcast to add it to your list (max 10 feeds). An AssemblyAI API Key is required for podcast transcription. Episodes will be automatically processed and added to your feed.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newPodcastRss}
                  onChange={(e) => setNewPodcastRss(e.target.value)}
                  onKeyPress={handlePodcastKeyPress}
                  placeholder="https://example.com/podcast/feed.xml"
                  className="flex-1"
                  disabled={isAddingPodcast || podcasts.length >= 10 || !profile?.transcript_api_key}
                />
                <Button 
                  onClick={handleAddPodcast}
                  disabled={!newPodcastRss.trim() || rssExists(newPodcastRss.trim()) || isAddingPodcast || podcasts.length >= 10 || !profile?.transcript_api_key}
                  size="default"
                  className="whitespace-nowrap"
                >
                  {isAddingPodcast ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Podcast Feed
                </Button>
              </div>
              
              {/* RSS Feed validation messages */}
              {!profile?.transcript_api_key && (
                <p className="text-sm text-destructive">
                  Please add and save your AssemblyAI API Key above before adding podcast feeds.
                </p>
              )}
              {newPodcastRss.trim() && rssExists(newPodcastRss.trim()) && !isAddingPodcast && (
                <p className="text-sm text-destructive">
                  This podcast feed has already been added.
                </p>
              )}
              {podcasts.length >= 10 && (
                <p className="text-sm text-destructive">
                  You've reached the maximum limit of 10 podcast feeds. Remove a feed to add a new one.
                </p>
              )}
            </div>

            <Separator />

            {/* Existing Podcasts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Your Podcast Feeds</Label>
                <div className="flex items-center gap-4">
                  {podcastsLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  )}
                  {!podcastsLoading && (
                    <span className="text-sm text-muted-foreground">
                      {podcasts.length}/10 podcast feeds
                    </span>
                  )}
                </div>
              </div>
              
              {podcasts.length === 0 && !podcastsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No podcast feeds added yet</p>
                  <p className="text-xs">Add your first podcast RSS feed above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {podcasts.map((podcast) => (
                    <div 
                      key={podcast.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {podcast.image_url ? (
                            <img 
                              src={podcast.image_url} 
                              alt={podcast.podcast_name}
                              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                              <Radio className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">{podcast.podcast_name}</h4>
                              {podcast.status && (
                                <Badge 
                                  variant={podcast.status === 'processing' ? 'default' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {podcast.status === 'processing' ? 'Processing' : podcast.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {podcast.rss_feed}
                            </p>
                            {podcast.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {podcast.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePodcast(podcast.id)}
                        disabled={isDeletingPodcast}
                        className="ml-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeletingPodcast ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                  Add up to 10 categories to organize your content. Feed content will be automatically categorized based on your defined categories using AI. You can also manually edit the categories for any content item after it's been processed.
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

            {/* AI Assistant Customization */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">AI assistant customization</Label>
                <p className="text-sm text-muted-foreground">
                  The text fields below allow you to customize the way your AI assistant writes their content summaries, deep dives and how they categorize the content you add to your feed. This is optional, as there are system prompts in place that should generate good output. If you notice that you need to tweak it via custom instructions to fit your specific needs, you can use these input fields to add your preferences.
                </p>
              </div>
            </div>

            <Separator />

            {/* AI Prompts */}
            {profileLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading AI prompt settings...
              </div>
            ) : (
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
                    disabled={isUpdatingPrompts}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-deep-summary">AI Deep Dive Prompt</Label>
                  <p className="text-sm text-muted-foreground">
                    Customize how the AI generates detailed content analysis.
                  </p>
                  <Textarea
                    id="ai-deep-summary"
                    value={aiDeepSummaryPrompt}
                    onChange={(e) => setAiDeepSummaryPrompt(e.target.value)}
                    placeholder="Enter your custom AI deep dive prompt..."
                    className="min-h-[80px]"
                    disabled={isUpdatingPrompts}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-feed-categorization">AI Feed Categorization Prompt</Label>
                  <p className="text-sm text-muted-foreground">
                    Customize how the AI categorizes Feed items using your defined categories.
                  </p>
                  <Textarea
                    id="ai-feed-categorization"
                    value={aiFeedCategorizationPrompt}
                    onChange={(e) => setAiFeedCategorizationPrompt(e.target.value)}
                    placeholder="Enter your custom AI feed categorization prompt..."
                    className="min-h-[80px]"
                    disabled={isUpdatingPrompts}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="w-full">
          <Button 
            onClick={handleSaveChanges} 
            size="lg"
            disabled={isUpdatingPrompts || isUpdating || profileLoading}
            className="w-full"
          >
            {(isUpdatingPrompts || isUpdating) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

        {/* Chrome Extension Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Chrome className="h-5 w-5" />
              Chrome Extension
            </CardTitle>
            <CardDescription>
              Download the Supamind Chrome extension to save and process web content directly from your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-base">Browser Extension</h3>
                <p className="text-sm text-muted-foreground">
                  The Supamind Chrome extension allows you to quickly save web articles, YouTube videos, and other web content to your feed with a single click. The extension integrates seamlessly with your account and processes content using the same AI capabilities.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleDownloadExtension}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Download className="h-4 w-4" />
                  Download Chrome Extension
                </Button>
                <div className="text-sm text-muted-foreground self-center">
                  Version 1.0.0 • Compatible with Chrome
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2">Installation Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the extension zip file using the button above</li>
                  <li>Extract the zip file to a folder on your computer</li>
                  <li>Open Chrome and go to chrome://extensions/</li>
                  <li>Enable "Developer mode" in the top right corner</li>
                  <li>Click "Load unpacked" and select the extracted folder</li>
                  <li>The Supamind extension will appear in your extensions bar</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email-to-Feed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email-to-Feed
            </CardTitle>
            <CardDescription>
              Add web articles to your feed by sending URLs via email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-base">Send URLs to Your Feed</h3>
                <p className="text-sm text-muted-foreground">
                  You can easily add web articles to your feed by sending URLs via email. Simply email any web article URL to <strong>mail@supabase.ai</strong> and it will automatically be processed and added to your feed.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2">Important Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Email must be sent from: <strong>{email || 'your registered email'}</strong></li>
                  <li>Send the web article URL to: <strong>mail@supabase.ai</strong></li>
                  <li>Content will appear in your feed within 1-2 minutes</li>
                  <li>Only web article URLs are supported via email</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 