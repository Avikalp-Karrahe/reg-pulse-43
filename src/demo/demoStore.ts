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

  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.loadFromStorage() || this.getDefaultData();
    this.state.toolCalls = this.loadToolCallsFromStorage();
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

    // Add issues with escalation check
    const newIssues: Issue[] = callData.issues.map((issue, index) => {
      const processedIssue: Issue = {
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
      };

      // Check for escalation if setting is enabled
      if (this.state.settings.enableSlackEscalation && 
          (issue.severity === 'high' || issue.severity === 'critical')) {
        this.escalateToSlack(processedIssue);
      }

      return processedIssue;
    });

    this.data.issues.unshift(...newIssues);
    this.saveToStorage();
    this.notify();

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
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  addIssue(issue: any) {
    // No-op for demo mode
  }

  addToolCall(toolCall: ToolCall) {
    this.state.toolCalls.unshift(toolCall);
    // Keep only last 100 tool calls
    if (this.state.toolCalls.length > 100) {
      this.state.toolCalls = this.state.toolCalls.slice(0, 100);
    }
    this.saveToolCallsToStorage();
    this.notify();
  }

  addTranscriptEntry(entry: any) {
    this.state.transcript.push(entry);
    this.notify();
  }

  getToolCalls(): ToolCall[] {
    return [...this.state.toolCalls];
  }

  clearToolCalls() {
    this.state.toolCalls = [];
    this.saveToolCallsToStorage();
    this.notify();
  }

  private saveToolCallsToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('regCompliance_tool_calls', JSON.stringify(this.state.toolCalls));
    } catch (error) {
      console.warn('Failed to save tool calls to storage:', error);
    }
  }

  private loadToolCallsFromStorage(): ToolCall[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('regCompliance_tool_calls');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load tool calls from storage:', error);
      return [];
    }
  }

  state = { 
    isDemoMode: true, 
    toolCalls: [] as ToolCall[],
    calls: [],
    issues: [],
    transcript: [],
    settings: { enableSlackEscalation: true, reducedMotion: false }
  };

  escalateToSlack(issue: any): void {
    const escalationPayload = {
      channel: "slack#risk-alerts",
      category: issue.category,
      severity: issue.severity,
      snippet: issue.evidence_snippet || issue.rationale || "No evidence available",
      link: `#/call/${issue.callId}`,
      timestamp: new Date().toISOString()
    };

    // Add tool call to console
    const toolCall: ToolCall = {
      id: `escalate-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tool: "notify.escalate",
      data: escalationPayload,
      duration: Math.floor(Math.random() * 200) + 100
    };

    this.addToolCall(toolCall);

    // Console log the payload
    console.log('🚨 Slack Escalation:', escalationPayload);

    // Show toast notification (this will be handled by the component consuming this)
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('slackEscalation', { 
        detail: { category: issue.category, severity: issue.severity } 
      }));
    }
  }

  updateSettings(settings: Partial<typeof this.state.settings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
    this.saveToStorage();
    this.notify();
  }

  getSettings() {
    return { ...this.state.settings };
  }
}

export const demoStore = new DemoStore();

// Export legacy types for compatibility
export interface ToolCall {
  id: string;
  timestamp: string;
  tool: string;
  status?: 'success' | 'error';
  duration_ms?: number;
  duration: number;
  input?: any;
  output?: any;
  data?: any;
}