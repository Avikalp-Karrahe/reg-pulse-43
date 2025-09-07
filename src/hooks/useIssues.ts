import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useIssues = (callId?: string) => {
  return useQuery({
    queryKey: ['issues', callId],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select(`
          id,
          call_id,
          category,
          severity,
          rationale,
          reg_reference,
          timestamp,
          calls!inner(call_id, started_at)
        `)
        .order('timestamp', { ascending: false });

      // If callId is provided, filter by specific call
      if (callId) {
        query = query.eq('call_id', callId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch issues: ${error.message}`);
      }

      return data.map(issue => ({
        id: issue.id,
        callId: issue.call_id,
        category: issue.category,
        severity: issue.severity,
        rationale: issue.rationale,
        regReference: issue.reg_reference,
        timestamp: issue.timestamp,
        callDetails: issue.calls ? {
          callId: issue.calls.call_id,
          startedAt: issue.calls.started_at,
        } : null,
      }));
    },
    enabled: true, // Always enabled, will return all issues if no callId
    staleTime: 30000,
    gcTime: 300000,
  });
};

// Hook specifically for analytics - gets all issues for analysis
export const useAllIssues = () => {
  return useQuery({
    queryKey: ['all-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          id,
          category,
          severity,
          timestamp,
          rationale,
          reg_reference,
          calls!inner(started_at, risk_score)
        `)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch all issues: ${error.message}`);
      }

      return data.map(issue => ({
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        timestamp: issue.timestamp,
        rationale: issue.rationale,
        regReference: issue.reg_reference,
        callDate: issue.calls?.started_at,
        riskScore: issue.calls?.risk_score || 0,
      }));
    },
    staleTime: 60000, // Analytics data can be stale for longer
    gcTime: 600000,
  });
};