# Onboarding System

This onboarding system provides new users with introductory tours of the Feed, Microcasts, and Notebooks pages. It shows a welcome dialog followed by step-by-step tooltips that guide users through key interface elements.

## Features

- **One-time display**: Onboarding only shows once per page per user
- **Persistent storage**: Completion status is stored in the database
- **Responsive**: Works on both desktop and mobile
- **Accessible**: Proper focus management and keyboard navigation
- **Flexible**: Easy to customize steps and content for each page

## Components

### Core Components

- **`OnboardingManager`**: Main orchestrator that manages the onboarding flow
- **`WelcomeDialog`**: Initial welcome message explaining what the page is for
- **`OnboardingTooltip`**: Step-by-step tooltips that point to UI elements
- **`OnboardingOverlay`**: Creates highlighting and background dimming effects

### Configuration

- **`OnboardingConfigs.ts`**: Contains step-by-step configurations for each page
- **`OnboardingTypes.ts`**: TypeScript interfaces and types
- **`useOnboarding.tsx`**: React hook for managing onboarding state

## Usage

### 1. Import and Setup

```tsx
import { OnboardingManager } from '@/components/onboarding/OnboardingManager';
import { feedOnboardingConfig } from '@/components/onboarding/OnboardingConfigs';
import { useOnboarding } from '@/hooks/useOnboarding';

const MyPage = () => {
  const { needsOnboarding, completeOnboarding, isLoading } = useOnboarding('feed');
  
  return (
    <div>
      {needsOnboarding && !isLoading && (
        <OnboardingManager
          config={feedOnboardingConfig}
          onComplete={completeOnboarding}
        />
      )}
      {/* Your page content */}
    </div>
  );
};
```

### 2. Add Data Attributes

Add `data-onboarding` attributes to elements you want to highlight:

```tsx
<Button data-onboarding="add-source-button">
  Add Source
</Button>

<div data-onboarding="feed-content">
  {/* Content area */}
</div>
```

### 3. Configure Steps

Edit the configuration files to customize the onboarding steps:

```tsx
export const feedOnboardingConfig: OnboardingConfig = {
  page: 'feed',
  welcomeTitle: 'Welcome to Your Feed!',
  welcomeDescription: 'Your feed is a personalized content stream...',
  steps: [
    {
      id: 'add-source',
      title: 'Add New Sources',
      description: 'Click here to add websites, upload documents...',
      targetSelector: '[data-onboarding="add-source-button"]',
      position: 'bottom',
    },
    // More steps...
  ],
};
```

## Database Schema

The system adds three fields to the `profiles` table:

- `onboarding_completed_feed: boolean`
- `onboarding_completed_microcasts: boolean` 
- `onboarding_completed_notebooks: boolean`

## Step Configuration Options

### OnboardingStep Interface

```tsx
interface OnboardingStep {
  id: string;                    // Unique identifier
  title: string;                 // Tooltip title
  description: string;           // Tooltip description
  targetSelector?: string;       // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right'; // Tooltip position
  action?: () => void;          // Optional action to perform on step
}
```

### Positioning

- If `position` is specified, it forces that position
- If not specified, the system auto-detects the best position based on available space
- Tooltips adjust automatically to stay within viewport bounds

## Customization

### Adding New Pages

1. Create a new configuration in `OnboardingConfigs.ts`
2. Add the page type to the `OnboardingPage` type in `useOnboarding.tsx`
3. Add corresponding database field in a new migration
4. Update the `getCompletionField` function in `useOnboarding.tsx`

### Styling

The components use Tailwind CSS and shadcn/ui components. Customize by:

- Modifying the component styles directly
- Updating the Tailwind classes
- Overriding CSS variables for shadcn/ui components

### Advanced Highlighting

For complex highlighting needs, modify `OnboardingOverlay.tsx` to support:

- Multiple simultaneous highlights
- Custom highlight shapes
- Animated highlighting effects

## Best Practices

### Data Attributes

- Use descriptive, kebab-case names: `data-onboarding="create-notebook-button"`
- Place on the most specific, stable element (avoid dynamic classes)
- Ensure the element is always rendered when the onboarding might show

### Step Design

- Keep descriptions concise (1-2 sentences max)
- Order steps logically following user workflow
- Test on different screen sizes
- Ensure steps work even if some UI elements are hidden/disabled

### Content Guidelines

- Use action-oriented language: "Click here to..." instead of "This is where you..."
- Explain the "why" not just the "what": "Add sources to build your knowledge base"
- Match the tone and voice of your application

## Troubleshooting

### Onboarding Not Showing

1. Check that the user profile has the completion field set to `false`
2. Verify the `useOnboarding` hook is properly configured
3. Ensure the `OnboardingManager` is conditionally rendered correctly

### Tooltips Positioning Incorrectly

1. Verify the `data-onboarding` selector matches exactly
2. Check that the target element is visible and rendered
3. Test with different viewport sizes
4. Consider manually setting the `position` prop

### Database Issues

1. Ensure the migration has been applied: `npx supabase db push`
2. Check that the profiles table has the onboarding fields
3. Verify RLS policies allow users to update their own profiles

## Future Enhancements

- **Progress indicators**: Show step X of Y
- **Skip specific steps**: Allow skipping individual steps
- **Branching flows**: Different paths based on user actions
- **Analytics**: Track completion rates and drop-off points
- **Dynamic content**: Personalized onboarding based on user data
- **Video integration**: Embed short videos in tooltips
- **Keyboard navigation**: Full keyboard accessibility