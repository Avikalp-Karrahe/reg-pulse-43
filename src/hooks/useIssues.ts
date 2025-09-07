import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/types/database.types';
import { isDemoMode, isDemoCall, getDemoIssues } from '@/lib/demoConfig';

export const useIssues = (callId?: string) => {
  return useQuery({
    queryKey: ['issues', callId, isDemoMode()],
    queryFn: async () => {
      // Return demo data if demo mode is enabled and it's a demo call
      if (isDemoMode() && callId && isDemoCall(callId)) {
        const demoIssues = getDemoIssues(callId);
        const mappedIssues = demoIssues.map((issue, index) => ({
          id: `${callId}_issue_${index}`,
          callId: callId,
          category: issue.category,
          severity: issue.severity,
          rationale: `Demo issue: ${issue.snippet}`,
          regReference: 'Demo Regulation',
          timestamp: new Date().toISOString(),
          evidenceSnippet: issue.snippet,
          evidenceStartMs: parseInt(issue.timestamp.split(':')[0]) * 60000 + parseInt(issue.timestamp.split(':')[1]) * 1000,
          evidenceEndMs: parseInt(issue.timestamp.split(':')[0]) * 60000 + parseInt(issue.timestamp.split(':')[1]) * 1000 + 8000,
          modelRationale: `Demo analysis for ${issue.category}`,
          modelVersion: 'demo-v1.0',
          callDetails: {
            callId: callId,
            startedAt: new Date().toISOString(),
          },
        }));
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return mappedIssues;
      }
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
          evidence_snippet,
          evidence_start_ms,
          evidence_end_ms,
          model_rationale,
          model_version,
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
        evidenceSnippet: issue.evidence_snippet,
        evidenceStartMs: issue.evidence_start_ms,
        evidenceEndMs: issue.evidence_end_ms,
        modelRationale: issue.model_rationale,
        modelVersion: issue.model_version,
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