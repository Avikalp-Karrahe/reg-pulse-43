import { useState, useCallback } from 'react';

export interface ComplianceIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  reg_reference: string;
  timestamp: string;
}

export interface ToolhouseResponse {
  content: string;
  issues: ComplianceIssue[];
}

export const useToolhouseAgent = () => {
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [allIssues, setAllIssues] = useState<ComplianceIssue[]>([]);

  const sendMessage = useCallback(async (message: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const url = runId 
        ? `https://agents.toolhouse.ai/b95d75ac-d344-4d8e-a687-b2e4be118e1b/${runId}`
        : 'https://agents.toolhouse.ai/b95d75ac-d344-4d8e-a687-b2e4be118e1b';
      
      const method = runId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Capture run ID from headers if this is a new conversation
      if (!runId) {
        const newRunId = response.headers.get('X-Toolhouse-Run-ID');
        if (newRunId) {
          setRunId(newRunId);
        }
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Update streaming content
        setStreamingContent(prev => prev + decoder.decode(value, { stream: true }));
        
        // Look for complete JSON blocks in the accumulated content
        const jsonBlocks = extractJsonBlocks(buffer);
        const newIssues = jsonBlocks.map(block => ({
          ...block,
          timestamp: new Date().toLocaleTimeString(),
        }));
        
        if (newIssues.length > 0) {
          setAllIssues(prev => [...prev, ...newIssues]);
        }
      }
    } catch (error) {
      console.error('Error sending message to Toolhouse:', error);
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  const resetSession = useCallback(() => {
    setRunId(null);
    setStreamingContent('');
    setAllIssues([]);
    setIsLoading(false);
  }, []);

  const calculateRiskScore = useCallback(() => {
    if (allIssues.length === 0) return 0;
    
    const severityWeights = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };
    
    const totalWeight = allIssues.reduce(
      (sum, issue) => sum + severityWeights[issue.severity],
      0
    );
    
    // Normalize to 0-100 scale
    return Math.min(100, (totalWeight / allIssues.length) * 25);
  }, [allIssues]);

  return {
    sendMessage,
    resetSession,
    streamingContent,
    allIssues,
    riskScore: calculateRiskScore(),
    isLoading,
    runId,
  };
};

// Helper function to extract JSON blocks from markdown
function extractJsonBlocks(content: string): ComplianceIssue[] {
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  const issues: ComplianceIssue[] = [];
  let match;

  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // Validate that it has the required fields for a compliance issue
      if (
        parsed.category &&
        parsed.severity &&
        parsed.rationale &&
        parsed.reg_reference &&
        ['low', 'medium', 'high', 'critical'].includes(parsed.severity)
      ) {
        issues.push(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse JSON block:', error);
    }
  }

  return issues;
}