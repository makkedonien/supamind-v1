import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingDialogueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: React.ReactNode;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const OnboardingDialogue: React.FC<OnboardingDialogueProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  isLoading = false
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">{description}</DialogDescription>
        </DialogHeader>
        {children && (
          <div className="py-3 sm:py-4 overflow-y-auto">
            {children}
          </div>
        )}
        <DialogFooter>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Okay, understood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

