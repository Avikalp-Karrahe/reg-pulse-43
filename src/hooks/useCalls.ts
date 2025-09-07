import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode, DEMO_CALLS } from '@/lib/demoConfig';

export const useCalls = () => {
  return useQuery({
    queryKey: ['calls', isDemoMode()],
    queryFn: async () => {
      // Return demo data if demo mode is enabled
      if (isDemoMode()) {
        const demoData = Object.values(DEMO_CALLS).map(call => ({
          id: call.id,
          callId: call.id,
          date: new Date('2025-01-07T14:30:00Z').toLocaleDateString(),
          duration: call.duration,
          riskScore: call.riskScore,
          status: 'completed',
          startedAt: new Date('2025-01-07T14:30:00Z').toISOString(),
          endedAt: new Date('2025-01-07T14:45:30Z').toISOString(),
          issueCount: call.issueCount,
        }));
        
        // Simulate API delay for realistic demo experience
        await new Promise(resolve => setTimeout(resolve, 500));
        return demoData;
      }
      
      // Regular Supabase query for production data
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