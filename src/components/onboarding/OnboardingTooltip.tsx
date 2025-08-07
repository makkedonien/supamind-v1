import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { OnboardingStep, OnboardingPosition } from './OnboardingTypes';

interface OnboardingTooltipProps {
  step: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isVisible: boolean;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isVisible,
}) => {
  const [position, setPosition] = useState<OnboardingPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  useEffect(() => {
    if (!step.targetSelector || !isVisible) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.targetSelector!);
      if (element) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });

        // Determine best position for tooltip
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = viewportWidth - rect.right;
        const spaceLeft = rect.left;

        if (step.position) {
          setTooltipPosition(step.position);
        } else if (spaceRight > 400 && rect.right < viewportWidth * 0.7) {
          // Prefer right if there's good space and element is not too far right
          setTooltipPosition('right');
        } else if (spaceLeft > 400 && rect.left > viewportWidth * 0.3) {
          // Use left if there's good space and element is not too far left
          setTooltipPosition('left');
        } else if (spaceBelow > 350) {
          setTooltipPosition('bottom');
        } else if (spaceAbove > 350) {
          setTooltipPosition('top');
        } else {
          // Fallback: choose the side with most space
          const maxSpace = Math.max(spaceBelow, spaceAbove, spaceRight, spaceLeft);
          if (maxSpace === spaceRight) setTooltipPosition('right');
          else if (maxSpace === spaceLeft) setTooltipPosition('left');
          else if (maxSpace === spaceBelow) setTooltipPosition('bottom');
          else setTooltipPosition('top');
        }
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step.targetSelector, step.position, isVisible]);

  const getTooltipStyle = (): React.CSSProperties => {
    if (!position) return { display: 'none' };

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxWidth: '380px',
      minWidth: '300px',
    };

    // Custom adjustments for specific dialogs
    let dialogOffset = 0;
    if (step.targetSelector === '[data-onboarding="feed-content"]') {
      dialogOffset = 55; // Move feed content dialog down 55px
    } else if (step.targetSelector === '[data-onboarding="microcast-grid"]') {
      dialogOffset = 20; // Move audio library dialog down 20px
    }

    switch (tooltipPosition) {
      case 'bottom':
        return {
          ...baseStyle,
          top: position.top + position.height + 20 + dialogOffset,
          left: Math.max(20, Math.min(position.left, window.innerWidth - 400)),
        };
      case 'top':
        return {
          ...baseStyle,
          bottom: window.innerHeight - position.top + 20 - dialogOffset,
          left: Math.max(20, Math.min(position.left, window.innerWidth - 400)),
        };
      case 'right':
        return {
          ...baseStyle,
          top: Math.max(20, Math.min(position.top - 80 + dialogOffset, window.innerHeight - 250)),
          left: position.left + position.width + 20,
        };
      case 'left':
        return {
          ...baseStyle,
          top: Math.max(20, Math.min(position.top - 80 + dialogOffset, window.innerHeight - 250)),
          right: window.innerWidth - position.left + 20,
        };
      default:
        return baseStyle;
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="shadow-lg border-0" style={getTooltipStyle()}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {step.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 mb-4">{step.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {currentStepIndex + 1} of {totalSteps}
          </div>
          
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-3 w-3" />
                Back
              </Button>
            )}
            
            <Button
              onClick={() => {
                if (step.action) {
                  step.action();
                }
                onNext();
              }}
              size="sm"
              className="flex items-center gap-1"
            >
              {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
              {currentStepIndex < totalSteps - 1 && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};