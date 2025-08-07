import React, { useState, useEffect } from 'react';
import { WelcomeDialog } from './WelcomeDialog';
import { OnboardingOverlay } from './OnboardingOverlay';
import { OnboardingTooltip } from './OnboardingTooltip';
import { OnboardingConfig } from './OnboardingTypes';

interface OnboardingManagerProps {
  config: OnboardingConfig;
  onComplete: () => void;
}

export const OnboardingManager: React.FC<OnboardingManagerProps> = ({
  config,
  onComplete,
}) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Disable body scroll when onboarding is active
  useEffect(() => {
    if (showWelcome || showTour) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showWelcome, showTour]);

  const handleStartTour = () => {
    setShowWelcome(false);
    setShowTour(true);
    setCurrentStepIndex(0);
  };

  const handleSkipWelcome = () => {
    setShowWelcome(false);
    onComplete();
  };

  const handleSkipTour = () => {
    setShowTour(false);
    onComplete();
  };

  const handleNext = () => {
    if (currentStepIndex < config.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setShowTour(false);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const currentStep = config.steps[currentStepIndex];

  return (
    <>
      <WelcomeDialog
        isOpen={showWelcome}
        title={config.welcomeTitle}
        description={config.welcomeDescription}
        onStartTour={handleStartTour}
        onSkip={handleSkipWelcome}
      />

      {showTour && currentStep && (
        <>
          <OnboardingOverlay
            targetSelector={currentStep.targetSelector}
            isVisible={showTour}
          >
            <OnboardingTooltip
              step={currentStep}
              currentStepIndex={currentStepIndex}
              totalSteps={config.steps.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkipTour}
              isVisible={showTour}
            />
          </OnboardingOverlay>
        </>
      )}
    </>
  );
};