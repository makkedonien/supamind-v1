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
import { useCategories } from '@/contexts/CategoriesContext';
import { useProfile } from '@/hooks/useProfile';
import { usePodcasts } from '@/hooks/usePodcasts';
import { supabase } from '@/integrations/supabase/client';
import { useOnboardingDialogue } from '@/hooks/useOnboardingDialogue';
import { useIsMobile } from '@/hooks/use-mobile';

const Settings = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { 
    categories, 
    isLoading: categoriesLoading, 
    isCreating,
    isDeleting,
    createCategory, 
    deleteCategory,
    categoryNameExists 
  } = useCategories();
  
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
  
  // Onboarding dialogue
  const { isOpen: isOnboardingOpen, dismissDialogue, isUpdating: isOnboardingUpdating } = useOnboardingDialogue('settings_dialogue');
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Form state
  const [name, setName] = useState(user?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [transcriptApiKey, setTranscriptApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
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
      // Show masked value if API key exists in vault, otherwise empty
      setTranscriptApiKey(profile.transcript_key_vault_secret ? '••••••••' : '');
      setOpenaiApiKey(profile.openai_key_vault_secret ? '••••••••' : '');
      setGeminiApiKey(profile.gemini_key_vault_secret ? '••••••••' : '');
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
      if (!user || !transcriptApiKey || transcriptApiKey === '••••••••') return;
      
      // Store the API key in vault first
      const { data: secretId, error: vaultError } = await supabase.rpc('store_user_api_key', {
        p_user_id: user.id,
        p_api_key: transcriptApiKey.trim(),
        p_key_name: 'transcript'
      });

      if (vaultError) {
        console.error('Error storing API key in vault:', vaultError);
        throw vaultError;
      }

      // Update profile with the vault secret UUID
      await updateProfile.mutateAsync({
        transcript_key_vault_secret: secretId,
      });

      // Clear the input and show masked value
      setTranscriptApiKey('••••••••');
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  };

  const handleSaveOpenaiApiKey = async () => {
    try {
      if (!user || !openaiApiKey || openaiApiKey === '••••••••') return;
      
      // Store the API key in vault first
      const { data: secretId, error: vaultError } = await supabase.rpc('store_user_api_key', {
        p_user_id: user.id,
        p_api_key: openaiApiKey.trim(),
        p_key_name: 'openai'
      });

      if (vaultError) {
        console.error('Error storing API key in vault:', vaultError);
        throw vaultError;
      }

      // Update profile with the vault secret UUID
      await updateProfile.mutateAsync({
        openai_key_vault_secret: secretId,
      });

      // Clear the input and show masked value
      setOpenaiApiKey('••••••••');
    } catch (error) {
      console.error('Error saving OpenAI API key:', error);
    }
  };

  const handleSaveGeminiApiKey = async () => {
    try {
      if (!user || !geminiApiKey || geminiApiKey === '••••••••') return;
      
      // Store the API key in vault first
      const { data: secretId, error: vaultError } = await supabase.rpc('store_user_api_key', {
        p_user_id: user.id,
        p_api_key: geminiApiKey.trim(),
        p_key_name: 'gemini'
      });

      if (vaultError) {
        console.error('Error storing API key in vault:', vaultError);
        throw vaultError;
      }

      // Update profile with the vault secret UUID
      await updateProfile.mutateAsync({
        gemini_key_vault_secret: secretId,
      });

      // Clear the input and show masked value
      setGeminiApiKey('••••••••');
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
    }
  };

  const handleRemoveTranscriptApiKey = async () => {
    try {
      if (!user || !profile?.transcript_key_vault_secret) return;

      // Delete from vault
      const { error: vaultError } = await supabase.rpc('delete_user_api_key', {
        p_secret_id: profile.transcript_key_vault_secret,
        p_user_id: user.id
      });

      if (vaultError) {
        console.error('Error deleting API key from vault:', vaultError);
        throw vaultError;
      }

      // Update profile to null
      await updateProfile.mutateAsync({
        transcript_key_vault_secret: null,
      });

      setTranscriptApiKey('');
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  };

  const handleRemoveOpenaiApiKey = async () => {
    try {
      if (!user || !profile?.openai_key_vault_secret) return;

      // Delete from vault
      const { error: vaultError } = await supabase.rpc('delete_user_api_key', {
        p_secret_id: profile.openai_key_vault_secret,
        p_user_id: user.id
      });

      if (vaultError) {
        console.error('Error deleting API key from vault:', vaultError);
        throw vaultError;
      }

      // Update profile to null
      await updateProfile.mutateAsync({
        openai_key_vault_secret: null,
      });

      setOpenaiApiKey('');
    } catch (error) {
      console.error('Error removing OpenAI API key:', error);
    }
  };

  const handleRemoveGeminiApiKey = async () => {
    try {
      if (!user || !profile?.gemini_key_vault_secret) return;

      // Delete from vault
      const { error: vaultError } = await supabase.rpc('delete_user_api_key', {
        p_secret_id: profile.gemini_key_vault_secret,
        p_user_id: user.id
      });

      if (vaultError) {
        console.error('Error deleting API key from vault:', vaultError);
        throw vaultError;
      }

      // Update profile to null
      await updateProfile.mutateAsync({
        gemini_key_vault_secret: null,
      });

      setGeminiApiKey('');
    } catch (error) {
      console.error('Error removing Gemini API key:', error);
    }
  };

  const handlePodcastProcessingToggle = async (enabled: boolean) => {
    try {
      // Prevent enabling if API keys are missing
      if (enabled && (!profile?.transcript_key_vault_secret || !profile?.openai_key_vault_secret)) {
        console.error('Cannot enable podcast processing: API keys missing');
        return;
      }
      
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

  const handleOpenaiApiKeyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveOpenaiApiKey();
    }
  };

  const handleGeminiApiKeyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveGeminiApiKey();
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
        profile?.transcript_key_vault_secret) {
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

  const handleDismissOnboarding = async () => {
    setShowOnboarding(false);
    await dismissDialogue();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Onboarding Section */}
        {isOnboardingOpen && showOnboarding && (
          <Card className="border-2 border-pink-500 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Welcome to your user settings!</CardTitle>
              <CardDescription>
                Here you can configure your account, API keys, categories, podcast subscriptions and other settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground break-words">
                <p>
                  <strong className="text-pink-600">(Important) API Keys:</strong> For key functions to work, you need to provide API keys OpenAI, Gemini, and AssemblyAI API keys to enable AI features.
                </p>
                <p>
                  <strong>Podcast feeds:</strong> Add up to 10 RSS feeds to automatically process new podcast episodes as they are published and added to your podcast feed.
                </p>
                <p>
                  <strong>Categories:</strong> Create custom categories to for the AI to use when auto-categorizing your content.
                </p>
                <p>
                  <strong>AI customization:</strong> Optionally customize how the AI generates summaries and categorizes content. This is optional, as there are system prompts in place that should generate good output.
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={handleDismissOnboarding} 
                  disabled={isOnboardingUpdating}
                  className="w-full"
                >
                  {isOnboardingUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Okay, understood'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Important: For key features to work, you need to provide API keys for{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                OpenAI
              </a>
              ,{' '}
              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                Gemini
              </a>
              , and{' '}
              <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                AssemblyAI
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-api-key">OpenAI API Key</Label>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  id="openai-api-key"
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  onKeyPress={handleOpenaiApiKeyKeyPress}
                  placeholder={profile?.openai_key_vault_secret ? "API key is set (masked)" : "Enter your OpenAI API key"}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveOpenaiApiKey}
                    disabled={!openaiApiKey.trim() || openaiApiKey === '••••••••' || isUpdating}
                    size="default"
                    className="whitespace-nowrap flex-1 md:flex-none"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save API Key
                  </Button>
                  {profile?.openai_key_vault_secret && (
                    <Button 
                      onClick={handleRemoveOpenaiApiKey}
                      disabled={isUpdating}
                      size="default"
                      variant="destructive"
                      className="whitespace-nowrap flex-1 md:flex-none"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Enter your OpenAI API key to use your own OpenAI account for AI features.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  onKeyPress={handleGeminiApiKeyKeyPress}
                  placeholder={profile?.gemini_key_vault_secret ? "API key is set (masked)" : "Enter your Gemini API key"}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveGeminiApiKey}
                    disabled={!geminiApiKey.trim() || geminiApiKey === '••••••••' || isUpdating}
                    size="default"
                    className="whitespace-nowrap flex-1 md:flex-none"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save API Key
                  </Button>
                  {profile?.gemini_key_vault_secret && (
                    <Button 
                      onClick={handleRemoveGeminiApiKey}
                      disabled={isUpdating}
                      size="default"
                      variant="destructive"
                      className="whitespace-nowrap flex-1 md:flex-none"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Enter your Gemini API key to use your own Google Gemini account for AI features.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcript-api-key">AssemblyAI API Key</Label>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  id="transcript-api-key"
                  type="password"
                  value={transcriptApiKey}
                  onChange={(e) => setTranscriptApiKey(e.target.value)}
                  onKeyPress={handleApiKeyKeyPress}
                  placeholder={profile?.transcript_key_vault_secret ? "API key is set (masked)" : "Enter your transcription service API key from AssemblyAI"}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveApiKey}
                    disabled={!transcriptApiKey.trim() || transcriptApiKey === '••••••••' || isUpdating}
                    size="default"
                    className="whitespace-nowrap flex-1 md:flex-none"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save API Key
                  </Button>
                  {profile?.transcript_key_vault_secret && (
                    <Button 
                      onClick={handleRemoveTranscriptApiKey}
                      disabled={isUpdating}
                      size="default"
                      variant="destructive"
                      className="whitespace-nowrap flex-1 md:flex-none"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Required: Generate an API key with AssemblyAI and submit it here. This is required to enable podcast transcription and summary feature.
              </p>
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
              Add up to 10 podcast RSS feeds to automatically process and sync podcast episodes to your feed. An AssemblyAI and OpenAI API Key is required for podcast transcription, which you can add in the API Keys section above. Need help finding a podcast's RSS feed URL? Use this <a href="https://castos.com/tools/find-podcast-rss-feed/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">free RSS feed finder tool</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  disabled={isUpdating || !profile?.transcript_key_vault_secret || !profile?.openai_key_vault_secret}
                />
              </div>
              {(!profile?.transcript_key_vault_secret || !profile?.openai_key_vault_secret) && (
                <p className="text-sm text-destructive">
                  To enable podcast processing, please add both an AssemblyAI API Key and an OpenAI API Key in the API Keys section above.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Add Podcast Feed</Label>
                <p className="text-sm text-muted-foreground">
                  Enter the RSS feed URL of a podcast to add it to your list (max 10 feeds). An AssemblyAI API Key is required for podcast transcription. Episodes will be automatically processed and added to your feed.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  value={newPodcastRss}
                  onChange={(e) => setNewPodcastRss(e.target.value)}
                  onKeyPress={handlePodcastKeyPress}
                  placeholder="https://example.com/podcast/feed.xml"
                  className="flex-1"
                  disabled={isAddingPodcast || podcasts.length >= 10 || !profile?.transcript_key_vault_secret}
                />
                <Button 
                  onClick={handleAddPodcast}
                  disabled={!newPodcastRss.trim() || rssExists(newPodcastRss.trim()) || isAddingPodcast || podcasts.length >= 10 || !profile?.transcript_key_vault_secret}
                  size="default"
                  className="whitespace-nowrap w-full md:w-auto"
                >
                  {isAddingPodcast ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Podcast Feed
                </Button>
              </div>
              
              {/* RSS Feed validation messages */}
              {!profile?.transcript_key_vault_secret && (
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
                      className="flex items-center justify-between p-3 border rounded-lg gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {podcast.image_url ? (
                            <img 
                              src={podcast.image_url} 
                              alt={podcast.podcast_name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                              <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">
                                {isMobile && podcast.podcast_name.length > 20 
                                  ? `${podcast.podcast_name.slice(0, 17)}...` 
                                  : podcast.podcast_name}
                              </h4>
                              {podcast.status && (
                                <Badge 
                                  variant={podcast.status === 'processing' ? 'default' : 'secondary'} 
                                  className="text-xs max-md:hidden"
                                >
                                  {podcast.status === 'processing' ? 'Processing' : podcast.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-md:hidden">
                              {podcast.rss_feed}
                            </p>
                            {podcast.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-md:hidden">
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
                        className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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