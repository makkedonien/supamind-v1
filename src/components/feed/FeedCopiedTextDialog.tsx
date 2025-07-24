import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Clipboard } from 'lucide-react';

interface FeedCopiedTextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, content: string) => Promise<void>;
}

const FeedCopiedTextDialog = ({ open, onOpenChange, onSubmit }: FeedCopiedTextDialogProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(title.trim() || 'Pasted Text', content.trim());
      setTitle('');
      setContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding text source to feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span>Add Text to Feed</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feed-text-title">Title (optional)</Label>
            <Input
              id="feed-text-title"
              placeholder="Enter a title for this content"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="feed-text-content">Content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePasteFromClipboard}
                className="text-xs"
              >
                <Clipboard className="h-3 w-3 mr-1" />
                Paste from clipboard
              </Button>
            </div>
            <Textarea
              id="feed-text-content"
              placeholder="Paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-40 resize-y"
              required
            />
            <p className="text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? 'Adding to Feed...' : 'Add to Feed'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedCopiedTextDialog; 