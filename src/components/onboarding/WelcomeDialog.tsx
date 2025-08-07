import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, X } from 'lucide-react';

interface WelcomeDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({
  isOpen,
  title,
  description,
  onStartTour,
  onSkip,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden border-0">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lightbulb className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-base text-gray-600 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Skip for now
          </Button>
          <Button
            onClick={onStartTour}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Take a quick tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};