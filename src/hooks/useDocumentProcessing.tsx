
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useDocumentProcessing = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const processDocument = useMutation({
    mutationFn: async ({
      sourceId,
      filePath,
      sourceType,
      notebookId
    }: {
      sourceId: string;
      filePath: string;
      sourceType: string;
      notebookId?: string;
    }) => {
      console.log('Initiating document processing for:', { sourceId, filePath, sourceType, notebookId });

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          sourceId,
          filePath,
          sourceType,
          userId: user.id,
          notebookId
        }
      });

      if (error) {
        console.error('Document processing error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Document processing initiated successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to initiate document processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    processDocumentAsync: processDocument.mutateAsync,
    processDocument: processDocument.mutate,
    isProcessing: processDocument.isPending,
  };
};
