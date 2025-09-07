import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCalls = () => {
  return useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          id,
          call_id,
          started_at,
          ended_at,
          duration_sec,
          risk_score,
          status,
          issues!inner(count)
        `)
        .order('started_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch calls: ${error.message}`);
      }

      return data.map(call => ({
        id: call.id,
        callId: call.call_id,
        date: new Date(call.started_at).toLocaleDateString(),
        duration: call.duration_sec 
          ? `${Math.floor(call.duration_sec / 60)}:${(call.duration_sec % 60).toString().padStart(2, '0')}`
          : 'N/A',
        riskScore: call.risk_score || 0,
        status: call.status || 'Unknown',
        startedAt: call.started_at,
        endedAt: call.ended_at,
        issueCount: call.issues?.length || 0,
      }));
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};