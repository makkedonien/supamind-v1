import { OnboardingConfig } from './OnboardingTypes';

export const notebooksOnboardingConfig: OnboardingConfig = {
  page: 'notebooks',
  welcomeTitle: 'Welcome to Notebooks!',
  welcomeDescription: 'Notebooks are your AI-powered research workspace. Create notebooks to organize your sources, chat with AI about your content, and write notes with intelligent assistance.',
  steps: [
    {
      id: 'create-notebook',
      title: 'Create Your First Notebook',
      description: 'Click this button to create a new notebook. Each notebook can contain multiple sources and becomes a focused research space.',
      targetSelector: '[data-onboarding="create-notebook-button"]',
      position: 'bottom',
    },
    {
      id: 'notebook-cards',
      title: 'Your Notebook Collection',
      description: 'Your notebooks will appear here as cards. Each card shows the title, description, and quick access to your research.',
      targetSelector: '[data-onboarding="notebook-grid"]',
      position: 'top',
    },
  ],
};

export const feedOnboardingConfig: OnboardingConfig = {
  page: 'feed',
  welcomeTitle: 'Welcome to Your Feed!',
  welcomeDescription: 'Your feed is a personalized content stream. Add sources like websites, documents, and videos to build your knowledge base and create AI-generated summaries.',
  steps: [
    {
      id: 'add-source',
      title: 'Add New Sources',
      description: 'Click here to add websites, upload documents, or add YouTube videos to your feed. These become your AI-powered knowledge sources.',
      targetSelector: '[data-onboarding="add-source-button"]',
      position: 'left',
    },
    {
      id: 'view-toggle',
      title: 'Switch Views',
      description: 'Toggle between card and list view to see your content in different layouts.',
      targetSelector: '[data-onboarding="view-toggle"]',
      position: 'bottom',
    },
    {
      id: 'filters',
      title: 'Filter Your Content',
      description: 'Use filters to organize and find specific content by category, source type, or other criteria.',
      targetSelector: '[data-onboarding="filters"]',
      position: 'bottom',
    },
    {
      id: 'source-cards',
      title: 'Your Content Feed',
      description: 'Your sources appear here with AI-generated summaries. Click on any source to view details or create microcasts.',
      targetSelector: '[data-onboarding="feed-content"]',
      position: 'top',
    },
  ],
};

export const microcastsOnboardingConfig: OnboardingConfig = {
  page: 'microcasts',
  welcomeTitle: 'Welcome to Microcasts!',
  welcomeDescription: 'Microcasts are AI-generated audio summaries of your content. Perfect for learning on-the-go, they turn your sources into engaging audio content.',
  steps: [
    {
      id: 'create-microcast',
      title: 'Create Audio Summaries',
      description: 'Click here to create a new microcast. You can generate audio summaries from your feed sources or specific content.',
      targetSelector: '[data-onboarding="create-microcast-button"]',
      position: 'bottom',
    },
    {
      id: 'microcast-grid',
      title: 'Your Audio Library',
      description: 'Your generated microcasts appear here. Each card shows the title, duration, and generation status.',
      targetSelector: '[data-onboarding="microcast-grid"]',
      position: 'top',
    },
    {
      id: 'go-to-feed',
      title: 'Add More Sources',
      description: 'To create more microcasts, head to your feed to add more sources and content.',
      targetSelector: '[data-onboarding="go-to-feed-button"]',
      position: 'bottom',
    },
  ],
};