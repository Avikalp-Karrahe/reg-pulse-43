import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { dataAdapter } from '@/app/dataAdapter';

export const useSaveCall = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callData: any) => {
      return await dataAdapter.saveCall(callData);
    },

    onSuccess: (data) => {
      const mode = dataAdapter.isDemo ? "Demo" : "Call";
      toast({
        title: `${mode} Saved`,
        description: `${mode} saved successfully.`,
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