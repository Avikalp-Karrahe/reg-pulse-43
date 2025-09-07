import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComplianceIssue {
  category: string;
  severity: string;
  rationale: string;
  reg_reference: string;
  timestamp: string;
}

interface SaveCallData {
  callId: string;
  duration: number;
  riskScore: number;
  issues: ComplianceIssue[];
}

export const useSaveCall = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, duration, riskScore, issues }: SaveCallData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, save the call
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .insert({
          call_id: callId,
          duration_sec: duration,
          risk_score: Math.round(riskScore),
          status: 'completed',
          ended_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select('id')
        .single();

      if (callError) {
        throw new Error(`Failed to save call: ${callError.message}`);
      }

      // Then, save all issues if any exist
      if (issues.length > 0) {
        const issuesData = issues.map(issue => ({
          call_id: callData.id,
          category: issue.category,
          severity: issue.severity,
          rationale: issue.rationale,
          reg_reference: issue.reg_reference,
          timestamp: issue.timestamp,
          user_id: user.id,
        }));

        const { error: issuesError } = await supabase
          .from('issues')
          .insert(issuesData);

        if (issuesError) {
          throw new Error(`Failed to save issues: ${issuesError.message}`);
        }
      }

      return { callId: callData.id, issueCount: issues.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Call Saved",
        description: `Call saved successfully with ${data.issueCount} issues detected.`,
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