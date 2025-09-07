import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { dataAdapter, type SaveCallData } from '@/app/dataAdapter';

export const useSaveCall = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callData: SaveCallData) => {
      const { data, error } = await dataAdapter.saveCall(callData);
      if (error) {
        throw new Error(error.message || 'Failed to save call');
      }
      return data;
    },

    onSuccess: (data) => {
      const mode = dataAdapter.isDemo ? "Demo" : "Call";
      toast({
        title: `${mode} Saved`,
        description: `${mode} saved successfully with ${data.issueCount} issues detected.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['calls'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};