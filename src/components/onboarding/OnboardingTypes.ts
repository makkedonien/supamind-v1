export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

export interface OnboardingConfig {
  page: 'feed' | 'microcasts' | 'notebooks';
  welcomeTitle: string;
  welcomeDescription: string;
  steps: OnboardingStep[];
}

export interface OnboardingPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}