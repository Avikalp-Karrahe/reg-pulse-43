import { supabase } from '@/integrations/supabase/client';
import { demoStore } from '@/demo/demoStore';

// Types for our data models
export interface Call {
  id: string;
  call_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  risk_score: number | null;
  status: string | null;
  user_id: string | null;
  organization_id: string | null;
}

export interface Issue {
  id: string;
  call_id: string;
  category: string;
  severity: string | null;
  rationale: string | null;
  reg_reference: string | null;
  timestamp: string | null;
  evidence_snippet: string | null;
  evidence_start_ms: number | null;
  evidence_end_ms: number | null;
  model_rationale: string | null;
  model_version: string | null;
  user_id: string | null;
  organization_id: string | null;
}

export interface SaveCallData {
  callId: string;
  duration: number;
  riskScore: number;
  issues: Array<{
    category: string;
    severity: string;
    rationale: string;
    reg_reference: string;
    timestamp: string;
    evidenceSnippet?: string;
    evidenceStartMs?: number;
    evidenceEndMs?: number;
  }>;
}

// Demo mode detection
const isDemoMode = (): boolean => {
  // Check for global demo flag (useful for testing)
  if (typeof window !== 'undefined' && (window as any).__DEMO__) {
    return true;
  }
  
  // Check environment variable for published Lovable preview
  const envDemo = import.meta.env.VITE_DEMO_MODE;
  if (envDemo === 'true' || envDemo === '1') {
    return true;
  }
  
  // Check localStorage for user toggle
  if (typeof window !== 'undefined') {
    const localDemo = localStorage.getItem('regCompliance_demoMode');
    if (localDemo === 'true') {
      return true;
    }
  }
  
  // Default to demo mode for Lovable preview environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('lovable.app')) {
    return true;
  }
  
  return false;
};

// Data Adapter Class
class DataAdapter {
  private _isDemoMode: boolean;

  constructor() {
    this._isDemoMode = isDemoMode();
  }

  get isDemo(): boolean {
    return this._isDemoMode;
  }

  // Toggle demo mode (for UI controls)
  toggleDemoMode(enabled?: boolean): boolean {
    this._isDemoMode = enabled !== undefined ? enabled : !this._isDemoMode;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('regCompliance_demoMode', this._isDemoMode.toString());
      
      // Trigger a page reload to apply changes
      setTimeout(() => window.location.reload(), 100);
    }
    
    return this._isDemoMode;
  }

  // Get all calls
  async getCalls(): Promise<{ data: Call[] | null; error: any }> {
    if (this._isDemoMode) {
      const calls = demoStore.getCalls();
      return { data: calls, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('started_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get calls with issues count
  async getCallsWithIssues(): Promise<{ data: any[] | null; error: any }> {
    if (this._isDemoMode) {
      const calls = demoStore.getCalls();
      const callsWithIssues = calls.map(call => {
        const issues = demoStore.getIssuesForCall(call.id);
        return {
          ...call,
          issue_count: issues.length
        };
      });
      return { data: callsWithIssues, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          issues (count)
        `)
        .order('started_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get single call
  async getCall(id: string): Promise<{ data: Call | null; error: any }> {
    if (this._isDemoMode) {
      const call = demoStore.getCall(id);
      return { data: call, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', id)
        .single();
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get all issues
  async getIssues(): Promise<{ data: Issue[] | null; error: any }> {
    if (this._isDemoMode) {
      const issues = demoStore.getIssues();
      return { data: issues, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('timestamp', { ascending: false });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get issues for a specific call
  async getIssuesForCall(callId: string): Promise<{ data: Issue[] | null; error: any }> {
    if (this._isDemoMode) {
      const issues = demoStore.getIssuesForCall(callId);
      return { data: issues, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('call_id', callId)
        .order('timestamp', { ascending: false });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Save a new call with issues
  async saveCall(callData: SaveCallData): Promise<{ data: any; error: any }> {
    if (this._isDemoMode) {
      try {
        const result = demoStore.saveCall(callData);
        return { data: result, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }

    try {
      // Get current user for Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save the call
      const { data: callRecord, error: callError } = await supabase
        .from('calls')
        .insert({
          call_id: callData.callId,
          duration_sec: callData.duration,
          risk_score: Math.round(callData.riskScore),
          status: 'completed',
          ended_at: new Date().toISOString(),
          user_id: user.id,
        })
        .select('id')
        .single();

      if (callError) {
        throw new Error(`Failed to save call: ${callError.message}`);
      }

      // Save issues if any exist
      if (callData.issues.length > 0) {
        const issuesData = callData.issues.map(issue => ({
          call_id: callRecord.id,
          category: issue.category,
          severity: issue.severity,
          rationale: issue.rationale,
          reg_reference: issue.reg_reference,
          timestamp: issue.timestamp,
          evidence_snippet: issue.evidenceSnippet,
          evidence_start_ms: issue.evidenceStartMs,
          evidence_end_ms: issue.evidenceEndMs,
          user_id: user.id,
        }));

        const { error: issuesError } = await supabase
          .from('issues')
          .insert(issuesData);

        if (issuesError) {
          throw new Error(`Failed to save issues: ${issuesError.message}`);
        }
      }

      return { 
        data: { callId: callRecord.id, issueCount: callData.issues.length }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Analytics queries
  async getAnalytics(): Promise<{ data: any; error: any }> {
    if (this._isDemoMode) {
      const analytics = demoStore.getAnalytics();
      return { data: analytics, error: null };
    }

    try {
      // Get total calls
      const { count: totalCalls } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });

      // Get total issues
      const { count: totalIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true });

      // Get average risk score
      const { data: avgRiskData } = await supabase
        .from('calls')
        .select('risk_score');

      const avgRiskScore = avgRiskData?.length 
        ? avgRiskData.reduce((sum, call) => sum + (call.risk_score || 0), 0) / avgRiskData.length
        : 0;

      return {
        data: {
          totalCalls: totalCalls || 0,
          totalIssues: totalIssues || 0,
          averageRiskScore: Math.round(avgRiskScore),
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Reset demo data
  resetDemo(): void {
    if (this._isDemoMode) {
      demoStore.reset();
    }
  }
}

// Export singleton instance
export const dataAdapter = new DataAdapter();

// Export utility functions
export const isDemoActive = () => dataAdapter.isDemo;
export const toggleDemoMode = (enabled?: boolean) => dataAdapter.toggleDemoMode(enabled);
export const resetDemoData = () => dataAdapter.resetDemo();