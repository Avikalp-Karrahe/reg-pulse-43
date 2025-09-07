// Demo mode configuration and utilities

interface DemoConfig {
  enabled: boolean;
  callIds: string[];
  audioFiles: string[];
}

// Check if demo mode is enabled via environment variable
const isDemoModeEnabled = (): boolean => {
  // Check environment variable first
  const envDemo = import.meta.env.VITE_DEMO_MODE;
  if (envDemo !== undefined) {
    return envDemo === 'true' || envDemo === '1';
  }
  
  // Check localStorage for UI toggle
  if (typeof window !== 'undefined') {
    const localDemo = localStorage.getItem('regCompliance_demoMode');
    return localDemo === 'true';
  }
  
  return false;
};

// Demo configuration
export const demoConfig: DemoConfig = {
  enabled: isDemoModeEnabled(),
  callIds: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
  audioFiles: [
    '/demo/compliance-violation-call.svg',
    '/demo/low-risk-advisory-call.svg'
  ]
};

// Toggle demo mode (for UI controls)
export const toggleDemoMode = (enabled?: boolean): boolean => {
  const newState = enabled !== undefined ? enabled : !demoConfig.enabled;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('regCompliance_demoMode', newState.toString());
  }
  
  demoConfig.enabled = newState;
  
  // Trigger a page reload to apply changes
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
  
  return newState;
};

// Get demo mode status
export const isDemoMode = (): boolean => {
  return demoConfig.enabled;
};

// Demo data constants
export const DEMO_CALLS = {
  '550e8400-e29b-41d4-a716-446655440001': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'High-Risk Compliance Violations',
    description: 'Financial advisor making explicit guarantees and using pressure tactics',
    duration: '15:30',
    riskScore: 78,
    issueCount: 5,
    audioFile: '/demo/compliance-violation-call.svg'
  },
  '550e8400-e29b-41d4-a716-446655440002': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Low-Risk Advisory Session',
    description: 'Professional consultation with minor risk disclosure issues',
    duration: '13:45',
    riskScore: 25,
    issueCount: 1,
    audioFile: '/demo/low-risk-advisory-call.svg'
  }
};

// Demo issues summary
export const DEMO_ISSUES_SUMMARY = {
  '550e8400-e29b-41d4-a716-446655440001': [
    {
      category: 'Explicit Guarantee',
      severity: 'critical',
      timestamp: '2:15',
      snippet: 'I can guarantee you\'ll see at least 15% returns...'
    },
    {
      category: 'High-Pressure Sales Tactics',
      severity: 'high',
      timestamp: '8:45',
      snippet: 'This is a limited time offer that expires today...'
    },
    {
      category: 'Unsuitable Investment Advice',
      severity: 'high',
      timestamp: '11:20',
      snippet: 'You should put all your retirement savings...'
    },
    {
      category: 'Inadequate Risk Disclosure',
      severity: 'medium',
      timestamp: '5:10',
      snippet: 'This investment is basically risk-free...'
    },
    {
      category: 'Misleading Performance Claims',
      severity: 'medium',
      timestamp: '13:30',
      snippet: 'Our track record shows consistent 20% annual returns...'
    }
  ],
  '550e8400-e29b-41d4-a716-446655440002': [
    {
      category: 'Inadequate Risk Disclosure',
      severity: 'low',
      timestamp: '7:30',
      snippet: 'While there are some risks involved, they\'re minimal...'
    }
  ]
};

// Utility to check if a call ID is a demo call
export const isDemoCall = (callId: string): boolean => {
  return demoConfig.callIds.includes(callId);
};

// Get demo call data
export const getDemoCallData = (callId: string) => {
  return DEMO_CALLS[callId as keyof typeof DEMO_CALLS];
};

// Get demo issues for a call
export const getDemoIssues = (callId: string) => {
  return DEMO_ISSUES_SUMMARY[callId as keyof typeof DEMO_ISSUES_SUMMARY] || [];
};

// Demo mode banner message
export const DEMO_BANNER_MESSAGE = {
  title: '🎭 Demo Mode Active',
  description: 'You are viewing sample compliance data for demonstration purposes.',
  action: 'Disable Demo Mode'
};

export default demoConfig;