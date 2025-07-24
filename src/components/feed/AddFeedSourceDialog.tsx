import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Link, Copy } from 'lucide-react';
import { useFeedSources } from '@/hooks/useFeedSources';
import { useFeedFileUpload } from '@/hooks/useFeedFileUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MultipleFeedWebsiteUrlsDialog from './MultipleFeedWebsiteUrlsDialog';
import FeedCopiedTextDialog from './FeedCopiedTextDialog';

interface AddFeedSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFeedSourceDialog = ({
  open,
  onOpenChange
}: AddFeedSourceDialogProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [showCopiedTextDialog, setShowCopiedTextDialog] = useState(false);
  const [showMultipleWebsiteDialog, setShowMultipleWebsiteDialog] = useState(false);
  const [isLocallyProcessing, setIsLocallyProcessing] = useState(false);

  const { user } = useAuth();
  const {
    addSourceAsync,
    updateSourceAsync,
    isAdding
  } = useFeedSources();

  const {
    uploadFile,
    isUploading
  } = useFeedFileUpload();

  const {
    toast
  } = useToast();

  // Reset local processing state when dialog opens
  useEffect(() => {
    if (open) {
      setIsLocallyProcessing(false);
    }
  }, [open]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  }, []);

  const processFileAsync = async (file: File, sourceId: string) => {
    try {
      console.log('Starting feed file processing for:', file.name, 'source:', sourceId);
      const fileType = file.type.includes('pdf') ? 'pdf' : file.type.includes('audio') ? 'audio' : 'text';

      // Update status to uploading
      await updateSourceAsync({
        sourceId,
        updates: {
          processing_status: 'uploading'
        }
      });

      // Upload the file
      const filePath = await uploadFile(file, sourceId);
      if (!filePath) {
        throw new Error('File upload failed - no file path returned');
      }
      console.log('Feed file uploaded successfully:', filePath);

      // Update with file path and set to processing
      await updateSourceAsync({
        sourceId,
        updates: {
          file_path: filePath,
          processing_status: 'processing'
        }
      });

      // Call feed-specific processing endpoint
      const { data, error } = await supabase.functions.invoke('process-feed-document', {
        body: {
          sourceId,
          filePath,
          sourceType: fileType,
          userId: user?.id
        }
      });

      if (error) {
        console.error('Feed document processing failed:', error);
        await updateSourceAsync({
          sourceId,
          updates: {
            processing_status: 'failed'
          }
        });
      }

      console.log('Feed document processing completed for:', sourceId);
    } catch (error) {
      console.error('Feed file processing failed for:', file.name, error);

      // Update status to failed
      await updateSourceAsync({
        sourceId,
        updates: {
          processing_status: 'failed'
        }
      });
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    console.log('Processing multiple feed files:', files.length);
    setIsLocallyProcessing(true);

    try {
      // Create all sources first
      const sourcePromises = files.map(async (file) => {
        const fileType = file.type.includes('pdf') ? 'pdf' : file.type.includes('audio') ? 'audio' : 'text';
        const sourceData = {
          title: file.name,
          type: fileType as 'pdf' | 'text' | 'website' | 'youtube' | 'audio',
          file_size: file.size,
          processing_status: 'pending',
          metadata: {
            fileName: file.name,
            fileType: file.type,
            addedToFeed: true
          }
        };
        
        console.log('Creating feed source for:', file.name);
        return await addSourceAsync(sourceData);
      });

      const createdSources = await Promise.all(sourcePromises);
      console.log('All feed sources created successfully:', createdSources.length);

      // Close dialog immediately
      setIsLocallyProcessing(false);
      onOpenChange(false);

      // Show success toast
      toast({
        title: "Files Added to Feed",
        description: `${files.length} file${files.length > 1 ? 's' : ''} added to your feed and processing started`
      });

      // Process files in parallel (background)
      const processingPromises = files.map((file, index) => 
        processFileAsync(file, createdSources[index].id)
      );

      // Don't await - let processing happen in background
      Promise.allSettled(processingPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log('Feed file processing completed:', {
          successful,
          failed
        });

        if (failed > 0) {
          toast({
            title: "Processing Issues",
            description: `${failed} file${failed > 1 ? 's' : ''} had processing issues in your feed.`,
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error creating feed sources:', error);
      setIsLocallyProcessing(false);
      toast({
        title: "Error",
        description: `Failed to add files to feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleTextSubmit = async (title: string, content: string) => {
    if (!user) return;
    setIsLocallyProcessing(true);

    try {
      // Create source record first to get the ID
      const createdSource = await addSourceAsync({
        title,
        type: 'text',
        content,
        processing_status: 'processing',
        metadata: {
          characterCount: content.length,
          addedToFeed: true,
          webhookProcessed: true
        }
      });

      // Send to feed-specific webhook endpoint with source ID and user ID
      const { data, error } = await supabase.functions.invoke('process-feed-sources', {
        body: {
          type: 'copied-text',
          userId: user.id,
          title,
          content,
          sourceIds: [createdSource.id],
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Text has been added to your feed and sent for processing"
      });
    } catch (error) {
      console.error('Error adding text source to feed:', error);
      toast({
        title: "Error",
        description: `Failed to add text source to feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLocallyProcessing(false);
    }

    onOpenChange(false);
  };

  const handleMultipleWebsiteSubmit = async (urls: string[]) => {
    if (!user) return;
    setIsLocallyProcessing(true);

    try {
      console.log('Creating feed sources for multiple websites:', urls.length);
      
      // Create sources for all URLs
      const sourcePromises = urls.map(async (url, index) => {
        return await addSourceAsync({
          title: `Website ${index + 1}: ${url}`,
          type: 'website',
          url,
          processing_status: 'processing',
          metadata: {
            originalUrl: url,
            addedToFeed: true,
            webhookProcessed: true
          }
        });
      });

      const createdSources = await Promise.all(sourcePromises);
      console.log('All feed website sources created:', createdSources.length);

      // Send to feed-specific webhook endpoint with all source IDs and user ID
      const { data, error } = await supabase.functions.invoke('process-feed-sources', {
        body: {
          type: 'multiple-websites',
          userId: user.id,
          urls,
          sourceIds: createdSources.map(source => source.id),
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${urls.length} website${urls.length > 1 ? 's' : ''} added to your feed and sent for processing`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding multiple websites to feed:', error);
      toast({
        title: "Error",
        description: `Failed to add websites to feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLocallyProcessing(false);
    }
  };

  // Use local processing state instead of global processing states
  const isProcessingFiles = isLocallyProcessing;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#FFFFFF">
                    <path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z" />
                  </svg>
                </div>
                <DialogTitle className="text-xl font-medium">Add Sources to Feed</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-2">Add sources to your feed</h2>
              <p className="text-gray-600 text-sm mb-1">Sources added to your feed will be available for creating notebooks or browsing independently.</p>
              <p className="text-gray-500 text-xs">
                (Examples: research articles, news, podcasts, PDFs, reports, documentation, etc.)
              </p>
            </div>

            {/* File Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              } ${isProcessingFiles ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100">
                  <Upload className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {isProcessingFiles ? 'Processing files...' : 'Upload sources'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isProcessingFiles ? (
                      'Please wait while we process your files'
                    ) : (
                      <>
                        Drag & drop or{' '}
                        <button 
                          className="text-blue-600 hover:underline" 
                          onClick={() => document.getElementById('feed-file-upload')?.click()}
                          disabled={isProcessingFiles}
                        >
                          choose file
                        </button>{' '}
                        to upload
                      </>
                    )}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Supported file types: PDF, txt, Markdown, Audio (e.g. mp3)
                </p>
                <input
                  id="feed-file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.txt,.md,.mp3,.wav,.m4a"
                  onChange={handleFileSelect}
                  disabled={isProcessingFiles}
                />
              </div>
            </div>

            {/* Integration Options */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => setShowMultipleWebsiteDialog(true)}
                disabled={isProcessingFiles}
              >
                <Link className="h-6 w-6 text-green-600" />
                <span className="font-medium">Link - Website</span>
                <span className="text-sm text-gray-500">Multiple URLs at once</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => setShowCopiedTextDialog(true)}
                disabled={isProcessingFiles}
              >
                <Copy className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Paste Text - Copied Text</span>
                <span className="text-sm text-gray-500">Add copied content</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <FeedCopiedTextDialog 
        open={showCopiedTextDialog} 
        onOpenChange={setShowCopiedTextDialog} 
        onSubmit={handleTextSubmit} 
      />

      <MultipleFeedWebsiteUrlsDialog 
        open={showMultipleWebsiteDialog} 
        onOpenChange={setShowMultipleWebsiteDialog} 
        onSubmit={handleMultipleWebsiteSubmit} 
      />
    </>
  );
};

export default AddFeedSourceDialog; 