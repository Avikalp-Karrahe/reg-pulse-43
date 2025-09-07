// Demo Store - In-memory state with localStorage persistence
interface Call {
  id: string;
  user_id: string;
  audio_url: string;
  transcript: string;
  risk_score: number;
  duration_ms: number;
  created_at: string;
  call_type: string;
  status: string;
  metadata: any;
}

interface Issue {
  id: string;
  call_id: string;
  category: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  evidence_snippet: string;
  evidence_start_ms: number;
  evidence_end_ms: number;
  regulatory_reference: string;
  rationale: string;
  model_version: string;
  confidence_score: number;
  created_at: string;
}

export interface ToolCall {
  id: string;
  timestamp: string;
  tool: string;
  action: string;
  input: any;
  output: any;
  latency_ms: number;
  status: 'success' | 'error';
}

interface DemoSettings {
  enableSlackEscalation: boolean;
  demoMode: boolean;
}

class DemoStore {
  private calls: Call[] = [];
  private issues: Issue[] = [];
  private toolCalls: ToolCall[] = [];
  private settings: DemoSettings = {
    enableSlackEscalation: true,
    demoMode: true
  };
  private listeners: (() => void)[] = [];

  constructor() {
    // Initialize demo mode
    window.__DEMO__ = true;
    this.loadFromStorage();
    this.initializeIfEmpty();
  }

  // Storage persistence
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('demoStore');
      if (stored) {
        const data = JSON.parse(stored);
        this.calls = data.calls || [];
        this.issues = data.issues || [];
        this.toolCalls = data.toolCalls || [];
        this.settings = { ...this.settings, ...data.settings };
      }
    } catch (error) {
      console.warn('Failed to load demo store from localStorage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('demoStore', JSON.stringify({
        calls: this.calls,
        issues: this.issues,
        toolCalls: this.toolCalls,
        settings: this.settings
      }));
    } catch (error) {
      console.warn('Failed to save demo store to localStorage:', error);
    }
  }

  private async initializeIfEmpty() {
    if (this.calls.length === 0) {
      await this.resetToSeeds();
    }
  }

  // Seed data loading
  async resetToSeeds() {
    try {
      // Use dynamic imports for better bundling
      const callsModule = await import('./seeds/calls.json');
      const issuesModule = await import('./seeds/issues.json');
      
      this.calls = callsModule.default;
      this.issues = issuesModule.default as Issue[];
      this.toolCalls = [];
      
      this.saveToStorage();
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to load seed data, using fallback:', error);
      this.setFallbackData();
    }
  }

  private setFallbackData() {
    this.calls = [{
      id: "demo-call-001",
      user_id: "demo-user", 
      audio_url: "/demo/compliance-violation-call.svg",
      transcript: "Demo call transcript with compliance issues...",
      risk_score: 85,
      duration_ms: 245000,
      created_at: new Date().toISOString(),
      call_type: "consultation",
      status: "completed",
      metadata: {}
    }];

    this.issues = [{
      id: "issue-001",
      call_id: "demo-call-001",
      category: "Performance Guarantees",
      severity: "HIGH" as const,
      evidence_snippet: "You'll make 20% monthly, guaranteed.",
      evidence_start_ms: 142000,
      evidence_end_ms: 146500,
      regulatory_reference: "SEC 10b-5",
      rationale: "Explicit guarantee of investment returns.",
      model_version: "demo-v1",
      confidence_score: 0.95,
      created_at: new Date().toISOString()
    }];

    this.saveToStorage();
    this.notifyListeners();
  }

  // Getters
  getCalls(): Call[] {
    return [...this.calls];
  }

  getIssues(): Issue[] {
    return [...this.issues];
  }

  getIssuesForCall(callId: string): Issue[] {
    return this.issues.filter(issue => issue.call_id === callId);
  }

  getCall(id: string): Call | null {
    return this.calls.find(call => call.id === id) || null;
  }

  getToolCalls(): ToolCall[] {
    return [...this.toolCalls];
  }

  getSettings(): DemoSettings {
    return { ...this.settings };
  }

  // Setters
  addIssue(issue: Omit<Issue, 'id' | 'created_at'>): Issue {
    const newIssue: Issue = {
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    this.issues.push(newIssue);
    this.saveToStorage();
    this.notifyListeners();

    // Trigger Slack escalation for HIGH severity
    if (newIssue.severity === 'HIGH' && this.settings.enableSlackEscalation) {
      this.triggerSlackEscalation(newIssue);
    }

    return newIssue;
  }

  addToolCall(toolCall: Omit<ToolCall, 'id' | 'timestamp'>): ToolCall {
    const newToolCall: ToolCall = {
      ...toolCall,
      id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.toolCalls.push(newToolCall);
    this.saveToStorage();
    this.notifyListeners();

    return newToolCall;
  }

  updateSettings(newSettings: Partial<DemoSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
  }

  clearToolCalls() {
    this.toolCalls = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // Event handling
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  private triggerSlackEscalation(issue: Issue) {
    // Add escalation tool call
    this.addToolCall({
      tool: 'tools/notify.escalate',
      action: 'escalate',
      input: {
        severity: issue.severity,
        category: issue.category,
        snippet: issue.evidence_snippet
      },
      output: {
        channel: 'slack#risk-alerts',
        snippet: issue.evidence_snippet,
        link: `/history/${issue.call_id}#t=${issue.evidence_start_ms}`
      },
      latency_ms: Math.floor(Math.random() * 100) + 50,
      status: 'success' as const
    });

    // Dispatch custom event for UI notifications
    window.dispatchEvent(new CustomEvent('slackEscalation', {
      detail: {
        category: issue.category,
        severity: issue.severity
      }
    }));

    // Console log for debugging
    console.log('🚨 Slack Escalation:', {
      category: issue.category,
      severity: issue.severity,
      evidence: issue.evidence_snippet,
      channel: '#risk-alerts'
    });
  }

  // Calculate risk score based on issues
  calculateRiskScore(callId: string): number {
    const callIssues = this.getIssuesForCall(callId);
    if (callIssues.length === 0) return 0;

    const severityWeights = { HIGH: 3, MED: 2, LOW: 1 };
    const totalWeight = callIssues.reduce((sum, issue) => 
      sum + severityWeights[issue.severity], 0
    );
    
    // Normalize to 0-100 scale
    const maxPossibleWeight = callIssues.length * 3;
    return Math.round((totalWeight / maxPossibleWeight) * 100);
  }
}

// Export singleton instance
export const demoStore = new DemoStore();

// Utility function to check if demo mode is active
export const isDemoActive = (): boolean => {
  return window.__DEMO__ === true || 
         import.meta.env.VITE_DEMO_MODE === 'true' ||
         demoStore.getSettings().demoMode;
};

// Global demo mode toggle
declare global {
  interface Window {
    __DEMO__?: boolean;
  }
}