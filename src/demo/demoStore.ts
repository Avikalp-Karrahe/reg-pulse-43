interface CallData {
  id: string;
  callId: string;
  started_at: string;
  ended_at?: string;
  duration_sec: number;
  risk_score: number;
  status: string;
  participant?: string;
  client?: string;
  call_type?: string;
  advisor_id?: string;
}

interface IssueData {
  id: string;
  call_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  reg_reference: string;
  evidence_snippet: string;
  evidence_start_ms: number;
  evidence_end_ms: number;
  model_rationale: string;
  model_version: string;
  timestamp: string;
}

interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
  hasIssue?: boolean;
  issueId?: string;
}

interface ToolCall {
  id: string;
  timestamp: string;
  tool: string;
  status: 'success' | 'error';
  duration_ms: number;
  input: any;
  output: any;
}

interface DemoState {
  calls: CallData[];
  issues: IssueData[];
  transcript: TranscriptEntry[];
  toolCalls: ToolCall[];
  isDemoMode: boolean;
  settings: {
    enableSlackEscalation: boolean;
    reducedMotion: boolean;
  };
}

class DemoStore {
  public state: DemoState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage() || this.getInitialState();
    this.saveToStorage();
  }

  private getInitialState(): DemoState {
    return {
      calls: [],
      issues: [],
      transcript: [],
      toolCalls: [],
      isDemoMode: true,
      settings: {
        enableSlackEscalation: true,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }
    };
  }

  private loadFromStorage(): DemoState | null {
    try {
      const stored = localStorage.getItem('regcompliance-demo');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('regcompliance-demo', JSON.stringify(this.state));
    } catch {
      // Handle storage errors gracefully
    }
  }

  public notify() {
    this.listeners.forEach(listener => listener());
    this.saveToStorage();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Getters
  getCalls(): CallData[] {
    return this.state.calls;
  }

  getIssues(): IssueData[] {
    return this.state.issues;
  }

  getTranscript(): TranscriptEntry[] {
    return this.state.transcript;
  }

  getToolCalls(): ToolCall[] {
    return this.state.toolCalls;
  }

  getIsDemoMode(): boolean {
    return this.state.isDemoMode;
  }

  getSettings() {
    return this.state.settings;
  }

  // Setters
  setDemoMode(enabled: boolean) {
    this.state.isDemoMode = enabled;
    this.notify();
  }

  setCalls(calls: CallData[]) {
    this.state.calls = calls;
    this.notify();
  }

  setIssues(issues: IssueData[]) {
    this.state.issues = issues;
    this.notify();
  }

  setTranscript(transcript: TranscriptEntry[]) {
    this.state.transcript = transcript;
    this.notify();
  }

  addIssue(issue: IssueData) {
    this.state.issues.push(issue);
    this.notify();
  }

  addToolCall(toolCall: ToolCall) {
    this.state.toolCalls.push(toolCall);
    this.notify();
  }

  addTranscriptEntry(entry: TranscriptEntry) {
    this.state.transcript.push(entry);
    this.notify();
  }

  updateSettings(updates: Partial<DemoState['settings']>) {
    this.state.settings = { ...this.state.settings, ...updates };
    this.notify();
  }

  // Seed data loading
  async loadSeeds() {
    try {
      const [callsModule, issuesModule, transcriptModule] = await Promise.all([
        import('./seeds/calls.json'),
        import('./seeds/issues.json'), 
        import('./seeds/transcript.json')
      ]);

      this.state.calls = callsModule.default as CallData[];
      this.state.issues = issuesModule.default as IssueData[];
      this.state.transcript = transcriptModule.default as TranscriptEntry[];
      this.state.toolCalls = [];
      this.notify();
    } catch (error) {
      console.error('Failed to load demo seeds:', error);
    }
  }

  // Reset to initial state with seeds
  async reset() {
    this.state = this.getInitialState();
    await this.loadSeeds();
    this.notify();
  }

  // Calculate risk score from issues
  calculateRiskScore(): number {
    if (this.state.issues.length === 0) return 0;
    
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalWeight = this.state.issues.reduce(
      (sum, issue) => sum + severityWeights[issue.severity], 
      0
    );
    
    return Math.min(100, (totalWeight / this.state.issues.length) * 25);
  }
}

// Global demo store instance
export const demoStore = new DemoStore();

// Helper functions
export const setDemo = (enabled: boolean) => {
  demoStore.setDemoMode(enabled);
  if (typeof window !== 'undefined') {
    (window as any).__DEMO__ = enabled;
  }
};

export const isDemoMode = () => {
  if (typeof window !== 'undefined' && (window as any).__DEMO__) {
    return true;
  }
  return demoStore.getIsDemoMode();
};

// Initialize demo mode
if (typeof window !== 'undefined') {
  (window as any).__DEMO__ = true;
  demoStore.loadSeeds();
}

export type { CallData, IssueData, TranscriptEntry, ToolCall };
export default demoStore;