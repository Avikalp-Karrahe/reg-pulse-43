import type { Call, Issue, SaveCallData } from '@/app/dataAdapter';
import callsData from './seeds/calls.json';
import issuesData from './seeds/issues.json';
import transcriptData from './seeds/transcript.json';

class DemoStore {
  private readonly STORAGE_KEY = 'regCompliance_demo_data';
  
  private data: {
    calls: Call[];
    issues: Issue[];
    transcripts: Record<string, any>;
    lastModified: string;
  };

  constructor() {
    this.data = this.loadFromStorage() || this.getDefaultData();
  }

  private getDefaultData() {
    return {
      calls: callsData as Call[],
      issues: issuesData as Issue[],
      transcripts: transcriptData,
      lastModified: new Date().toISOString()
    };
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load demo data from storage:', error);
      return null;
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      this.data.lastModified = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save demo data to storage:', error);
    }
  }

  // Public methods
  getCalls(): Call[] {
    return [...this.data.calls];
  }

  getCall(id: string): Call | null {
    return this.data.calls.find(call => call.id === id) || null;
  }

  getIssues(): Issue[] {
    return [...this.data.issues];
  }

  getIssuesForCall(callId: string): Issue[] {
    return this.data.issues.filter(issue => issue.call_id === callId);
  }

  getTranscript(callId: string) {
    return this.data.transcripts[callId] || null;
  }

  saveCall(callData: SaveCallData): { callId: string; issueCount: number } {
    const newCall: Call = {
      id: `demo-call-${Date.now()}`,
      call_id: callData.callId,
      started_at: new Date(Date.now() - callData.duration * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_sec: callData.duration,
      risk_score: Math.round(callData.riskScore),
      status: 'completed',
      user_id: 'demo-user-123',
      organization_id: 'demo-org-456'
    };

    // Add the call
    this.data.calls.unshift(newCall);

    // Add issues
    const newIssues: Issue[] = callData.issues.map((issue, index) => ({
      id: `demo-issue-${Date.now()}-${index}`,
      call_id: newCall.id,
      category: issue.category,
      severity: issue.severity,
      rationale: issue.rationale,
      reg_reference: issue.reg_reference,
      timestamp: issue.timestamp,
      evidence_snippet: issue.evidenceSnippet || null,
      evidence_start_ms: issue.evidenceStartMs || null,
      evidence_end_ms: issue.evidenceEndMs || null,
      model_rationale: `AI detected violation in demo mode`,
      model_version: 'demo-v1',
      user_id: 'demo-user-123',
      organization_id: 'demo-org-456'
    }));

    this.data.issues.unshift(...newIssues);
    this.saveToStorage();

    return { callId: newCall.id, issueCount: newIssues.length };
  }

  getAnalytics() {
    const totalCalls = this.data.calls.length;
    const totalIssues = this.data.issues.length;
    const avgRiskScore = this.data.calls.length > 0
      ? Math.round(this.data.calls.reduce((sum, call) => sum + (call.risk_score || 0), 0) / this.data.calls.length)
      : 0;

    const issuesByCategory = this.data.issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issuesBySeverity = this.data.issues.reduce((acc, issue) => {
      const severity = issue.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCalls,
      totalIssues,
      averageRiskScore: avgRiskScore,
      issuesByCategory,
      issuesBySeverity,
      recentActivity: this.data.calls.slice(0, 5).map(call => ({
        ...call,
        issueCount: this.getIssuesForCall(call.id).length
      }))
    };
  }

  reset(): void {
    this.data = this.getDefaultData();
    this.saveToStorage();
    
    // Optionally trigger a page reload
    if (typeof window !== 'undefined') {
      setTimeout(() => window.location.reload(), 100);
    }
  }

  // Legacy compatibility methods for existing components
  subscribe(listener: () => void): () => void {
    return () => {}; // No-op for demo mode
  }

  addIssue(issue: any) {
    // No-op for demo mode
  }

  addToolCall(toolCall: any) {
    // No-op for demo mode
  }

  addTranscriptEntry(entry: any) {
    // No-op for demo mode
  }

  getToolCalls() {
    return [];
  }

  state = { 
    isDemoMode: true, 
    toolCalls: [],
    calls: [],
    issues: [],
    transcript: [],
    settings: { enableSlackEscalation: true, reducedMotion: false }
  };
  notify() {}
}

export const demoStore = new DemoStore();

// Export legacy types for compatibility
export interface ToolCall {
  id: string;
  timestamp: string;
  tool: string;
  status: 'success' | 'error';
  duration_ms: number;
  input: any;
  output: any;
}