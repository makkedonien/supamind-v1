import React, { useEffect, useState } from 'react';
import { OnboardingPosition } from './OnboardingTypes';

interface OnboardingOverlayProps {
  targetSelector?: string;
  isVisible: boolean;
  children: React.ReactNode;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  targetSelector,
  isVisible,
  children,
}) => {
  const [targetPosition, setTargetPosition] = useState<OnboardingPosition | null>(null);

  useEffect(() => {
    if (!targetSelector || !isVisible) {
      setTargetPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // Define custom adjustments for specific elements
        let adjustments = { top: 0, left: 0, width: 0, height: 0 };
        
        if (targetSelector === '[data-onboarding="view-toggle"]') {
          adjustments = { top: -20, left: -5, width: 10, height: 10 }; // Moved up 5px more (was -15, now -20)
        } else if (targetSelector === '[data-onboarding="add-source-button"]') {
          adjustments = { top: -20, left: -5, width: 10, height: 10 }; // Moved up 5px more (was -15, now -20)
        } else if (targetSelector === '[data-onboarding="filters"]') {
          adjustments = { top: -15, left: -5, width: 10, height: 10 }; // Filters moved up 15px
        } else if (targetSelector === '[data-onboarding="feed-content"]') {
          adjustments = { top: -15, left: -5, width: 10, height: 10 }; // Feed content moved up 15px
        }
        
        setTargetPosition({
          top: rect.top + window.scrollY + adjustments.top,
          left: rect.left + window.scrollX + adjustments.left,
          width: rect.width + adjustments.width,
          height: rect.height + adjustments.height,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Light overlay covering the entire screen */}
      <div
        className="fixed inset-0 bg-black/30 z-[9990]"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Highlighted area */}
      {targetPosition && (
        <div
          className="fixed rounded-lg z-[9995]"
          style={{
            top: targetPosition.top - 6,
            left: targetPosition.left - 6,
            width: targetPosition.width + 12,
            height: targetPosition.height + 12,
            pointerEvents: 'none',
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
          }}
        />
      )}
      
      {children}
    </>
  );
};