import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Mic, FileText, Globe, Copy, Loader2, X } from 'lucide-react';
import { useMicrocasts } from '@/hooks/useMicrocasts';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useToast } from '@/hooks/use-toast';

interface CreateMicrocastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSourceIds: string[];
  onClearSelection?: () => void;
}

const CreateMicrocastDialog: React.FC<CreateMicrocastDialogProps> = ({
  open,
  onOpenChange,
  selectedSourceIds,
  onClearSelection
}) => {
  const { createMicrocast, isCreating } = useMicrocasts();
  const { sources } = useFeedSources();
  const { toast } = useToast();

  // Get selected sources
  const selectedSources = sources.filter(source => selectedSourceIds.includes(source.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSourceIds.length === 0) {
      toast({
        title: "No Sources Selected",
        description: "Please select at least one source for your microcast.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSourceIds.length > 3) {
      toast({
        title: "Too Many Sources Selected",
        description: "Please select up to 3 sources for your microcast.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMicrocast({
        sourceIds: selectedSourceIds,
      });

      toast({
        title: "Microcast Created",
        description: "Your microcast is being generated. This may take a few minutes.",
      });

      // Clear selection and close dialog
      onClearSelection?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating microcast:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create microcast. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'website':
      case 'youtube':
        return <Globe className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'text':
        return <Copy className="h-4 w-4" />;
      case 'audio':
      case 'podcast':
        return <Mic className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'website':
        return 'Website';
      case 'youtube':
        return 'YouTube';
      case 'pdf':
        return 'PDF';
      case 'text':
        return 'Text';
      case 'audio':
        return 'Audio';
      case 'podcast':
        return 'Podcast';
      default:
        return 'Document';
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <DialogTitle>Create Microcast</DialogTitle>
          </div>
          <DialogDescription>
            Generate a podcast-style conversation from your selected sources. The title will be automatically created based on your content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className={selectedSources.length > 5 ? "text-red-600" : ""}>
                Selected Sources ({selectedSources.length}{selectedSources.length > 5 ? "/5 max" : ""})
              </Label>
              {selectedSources.length > 0 && !isCreating && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {selectedSources.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No sources selected</p>
                <p className="text-xs mt-1">Go back to the feed to select sources</p>
              </div>
            ) : (
              <ScrollArea className="h-40 border rounded-md p-3">
                <div className="space-y-2">
                  {selectedSources.map((source, index) => (
                    <div key={source.id}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{source.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getSourceTypeLabel(source.type)}
                            </Badge>
                            {source.category && source.category.length > 0 && (
                              <div className="flex gap-1">
                                {source.category.slice(0, 2).map((cat) => (
                                  <Badge key={cat} variant="outline" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                                {source.category.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{source.category.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < selectedSources.length - 1 && (
                        <Separator className="mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Warning for too many sources */}
          {selectedSources.length > 5 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-red-900 mb-1">
                ⚠️ Too Many Sources
              </h4>
              <p className="text-xs text-red-800">
                You can select up to 5 sources for a microcast. Please remove {selectedSources.length - 5} source{selectedSources.length - 5 === 1 ? '' : 's'} to continue.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              🎙️ How it works
            </h4>
            <p className="text-xs text-blue-800">
              Your selected sources will be processed and turned into a podcast-style conversation summarizing your sources and surfacing key takeaways. <strong>This can takes about 5-20 minutes depending on the amount of sources and the their length and complexity.</strong>
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || selectedSources.length === 0 || selectedSources.length > 5}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Create Microcast
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMicrocastDialog;