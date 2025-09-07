// Data Adapter - Thin layer that routes to demo store or real backend
import { demoStore, isDemoActive as checkDemoActive } from '@/demo/demoStore';

// Type definitions (should match your existing types)
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

class DataAdapter {
  public isDemo: boolean = false;

  constructor() {
    this.updateDemoStatus();
  }

  updateDemoStatus() {
    this.isDemo = checkDemoActive();
  }

  toggleDemoMode(enabled?: boolean) {
    if (enabled !== undefined) {
      window.__DEMO__ = enabled;
      demoStore.updateSettings({ demoMode: enabled });
    } else {
      window.__DEMO__ = !window.__DEMO__;
      demoStore.updateSettings({ demoMode: window.__DEMO__ });
    }
    this.updateDemoStatus();
  }

  resetDemo() {
    if (this.isDemo) {
      demoStore.resetToSeeds();
    }
  }

  // Call methods
  async getCalls(): Promise<Call[]> {
    if (this.isDemo) {
      return demoStore.getCalls();
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.getCalls();
    return [];
  }

  async getCall(id: string): Promise<Call | null> {
    if (this.isDemo) {
      return demoStore.getCall(id);
    }
    
    // TODO: Replace with your actual API call  
    // return await apiClient.getCall(id);
    return null;
  }

  async saveCall(call: Partial<Call>): Promise<Call> {
    if (this.isDemo) {
      // Demo mode doesn't support creating new calls yet
      throw new Error('Creating calls not supported in demo mode');
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.saveCall(call);
    throw new Error('Not implemented');
  }

  // Issue methods
  async getIssues(): Promise<Issue[]> {
    if (this.isDemo) {
      return demoStore.getIssues();
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.getIssues();
    return [];
  }

  async getIssuesForCall(callId: string): Promise<Issue[]> {
    if (this.isDemo) {
      return demoStore.getIssuesForCall(callId);
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.getIssuesForCall(callId);
    return [];
  }

  async saveIssue(issue: Omit<Issue, 'id' | 'created_at'>): Promise<Issue> {
    if (this.isDemo) {
      return demoStore.addIssue(issue);
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.saveIssue(issue);
    throw new Error('Not implemented');
  }

  // Analytics methods
  async getAnalytics(timeRange?: string): Promise<any> {
    if (this.isDemo) {
      const calls = demoStore.getCalls();
      const issues = demoStore.getIssues();
      
      // Generate mock analytics from demo data
      return {
        totalCalls: calls.length,
        totalIssues: issues.length,
        avgRiskScore: calls.reduce((sum, call) => sum + call.risk_score, 0) / calls.length,
        severityBreakdown: {
          HIGH: issues.filter(i => i.severity === 'HIGH').length,
          MED: issues.filter(i => i.severity === 'MED').length,
          LOW: issues.filter(i => i.severity === 'LOW').length
        },
        categoryBreakdown: issues.reduce((acc, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        riskTrend: [
          { date: '2024-12-01', score: 65 },
          { date: '2024-12-02', score: 72 },
          { date: '2024-12-03', score: 58 },
          { date: '2024-12-04', score: 81 },
          { date: '2024-12-05', score: 69 },
          { date: '2024-12-06', score: 77 },
          { date: '2024-12-07', score: 85 }
        ]
      };
    }
    
    // TODO: Replace with your actual API call
    // return await apiClient.getAnalytics(timeRange);
    return {};
  }

  // Risk calculation
  calculateRiskScore(callId: string): number {
    if (this.isDemo) {
      return demoStore.calculateRiskScore(callId);
    }
    
    // TODO: Implement actual risk calculation
    return 0;
  }

  // Demo-specific methods
  async simulateAnalysis(text: string): Promise<Issue[]> {
    if (!this.isDemo) return [];

    // Load rules and analyze text
    return this.analyzeTextWithRules(text);
  }

  private async analyzeTextWithRules(text: string): Promise<Issue[]> {
    try {
      const rulesModule = await import('@/demo/rules.json');
      const rules = rulesModule.default;
      const foundIssues: Issue[] = [];

      for (const [ruleKey, rule] of Object.entries(rules)) {
        for (const pattern of (rule as any).patterns) {
          const regex = new RegExp(pattern, 'gi');
          const matches = text.match(regex);
          
          if (matches) {
            const evidence = matches[0];
            const startIndex = text.toLowerCase().indexOf(evidence.toLowerCase());
            
            const newIssue = {
              call_id: 'demo-call-001',
              category: (rule as any).category,
              severity: (rule as any).severity,
              evidence_snippet: evidence,
              evidence_start_ms: startIndex * 100, // Rough timing estimate
              evidence_end_ms: (startIndex + evidence.length) * 100,
              regulatory_reference: (rule as any).regulatory_reference,
              rationale: `Detected ${ruleKey} pattern: "${evidence}"`,
              model_version: 'demo-v1',
              confidence_score: 0.85
            };

            const savedIssue = demoStore.addIssue(newIssue);
            foundIssues.push(savedIssue);

            // Add tool call log
            demoStore.addToolCall({
              tool: 'tools/rules.match',
              action: 'analyze',
              input: { text, rule: ruleKey },
              output: {
                rule_name: ruleKey,
                phrase: evidence,
                severity: (rule as any).severity,
                reg_reference: (rule as any).regulatory_reference
              },
              latency_ms: Math.floor(Math.random() * 50) + 20,
              status: 'success'
            });
          }
        }
      }

      return foundIssues;
    } catch (error) {
      console.warn('Failed to analyze text with rules:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dataAdapter = new DataAdapter();

// Export utility functions
export const isDemoActive = () => checkDemoActive();
export const toggleDemoMode = (enabled?: boolean) => dataAdapter.toggleDemoMode(enabled);
export const resetDemoData = () => dataAdapter.resetDemo();