import { supabase } from '@/integrations/supabase/client';
import { ruleMatcher, type ComplianceIssue } from '@/lib/ruleMatching';
import type { TranscriptSegment } from './transcribe';

interface AnalyzeRequest {
  transcript: string;
  segments?: TranscriptSegment[];
  callId: string;
  duration?: number;
}

interface AnalyzeResponse {
  success: boolean;
  callId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: ComplianceIssue[];
  analysisMethod: 'rules-engine' | 'toolhouse-agent' | 'hybrid';
  error?: string;
}

// Toolhouse agent integration for complex cases
const analyzeWithToolhouse = async (transcript: string): Promise<{
  issues: ComplianceIssue[];
  riskScore: number;
}> => {
  try {
    const response = await fetch('https://agents.toolhouse.ai/b95d75ac-d344-4d8e-a687-b2e4be118e1b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Analyze this financial advisory call transcript for compliance violations:\n\n${transcript}`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Toolhouse API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Toolhouse response and extract issues
    const issues = extractIssuesFromToolhouseResponse(data.content || '');
    const riskScore = calculateToolhouseRiskScore(issues);
    
    return { issues, riskScore };
  } catch (error) {
    console.error('Toolhouse analysis error:', error);
    return { issues: [], riskScore: 0 };
  }
};

// Extract compliance issues from Toolhouse response
const extractIssuesFromToolhouseResponse = (content: string): ComplianceIssue[] => {
  const issues: ComplianceIssue[] = [];
  
  // Look for JSON blocks in the response
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = jsonBlockRegex.exec(content)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const parsed = JSON.parse(jsonContent);
      
      // Validate and convert to ComplianceIssue format
      if (parsed.category && parsed.severity && parsed.rationale) {
        const issue: ComplianceIssue = {
          category: parsed.category,
          severity: parsed.severity,
          rationale: parsed.rationale,
          reg_reference: parsed.reg_reference || 'Various',
          timestamp: new Date().toISOString(),
          evidence_snippet: parsed.evidence_snippet || null,
          evidence_start_ms: parsed.evidence_start_ms || null,
          evidence_end_ms: parsed.evidence_end_ms || null,
          model_rationale: parsed.model_rationale || 'AI-generated analysis',
          model_version: 'toolhouse-agent-v1.0'
        };
        issues.push(issue);
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON block from Toolhouse response:', parseError);
    }
  }
  
  return issues;
};

// Calculate risk score from Toolhouse issues
const calculateToolhouseRiskScore = (issues: ComplianceIssue[]): number => {
  if (issues.length === 0) return 0;
  
  const severityWeights = { critical: 3, high: 2, medium: 1, low: 0.5 };
  const totalWeight = issues.reduce((sum, issue) => {
    return sum + (severityWeights[issue.severity] || 1);
  }, 0);
  
  // Normalize to 0-100 scale
  const maxPossibleWeight = issues.length * severityWeights.critical;
  return Math.min(100, (totalWeight / maxPossibleWeight) * 100);
};

// Main analysis function
export const analyzeTranscript = async (request: AnalyzeRequest): Promise<AnalyzeResponse> => {
  try {
    const { transcript, segments = [], callId, duration = 0 } = request;
    
    // Step 1: Run deterministic rule matching first
    const ruleAnalysis = ruleMatcher.analyzeTranscript(segments.length > 0 ? segments : [
      {
        text: transcript,
        start: 0,
        end: duration * 1000,
        confidence: 0.9
      }
    ]);
    
    let finalIssues = ruleAnalysis.issues;
    let finalRiskScore = ruleAnalysis.riskScore;
    let analysisMethod: AnalyzeResponse['analysisMethod'] = 'rules-engine';
    
    // Step 2: If no issues found or low confidence, use Toolhouse agent
    if (ruleAnalysis.issues.length === 0 || ruleAnalysis.riskScore < 20) {
      console.log('Running Toolhouse analysis as fallback...');
      const toolhouseAnalysis = await analyzeWithToolhouse(transcript);
      
      if (toolhouseAnalysis.issues.length > 0) {
        // Merge results if both found issues
        if (ruleAnalysis.issues.length > 0) {
          finalIssues = [...ruleAnalysis.issues, ...toolhouseAnalysis.issues];
          finalRiskScore = Math.max(ruleAnalysis.riskScore, toolhouseAnalysis.riskScore);
          analysisMethod = 'hybrid';
        } else {
          finalIssues = toolhouseAnalysis.issues;
          finalRiskScore = toolhouseAnalysis.riskScore;
          analysisMethod = 'toolhouse-agent';
        }
      }
    }
    
    // Step 3: Insert call and issues into database
    await insertCallAndIssues(callId, transcript, duration, finalRiskScore, finalIssues);
    
    const riskLevel = ruleMatcher.getRiskLevel(finalRiskScore);
    
    return {
      success: true,
      callId,
      riskScore: finalRiskScore,
      riskLevel,
      issues: finalIssues,
      analysisMethod
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      success: false,
      callId: request.callId,
      riskScore: 0,
      riskLevel: 'low',
      issues: [],
      analysisMethod: 'rules-engine',
      error: error instanceof Error ? error.message : 'Unknown analysis error'
    };
  }
};

// Database insertion function
const insertCallAndIssues = async (
  callId: string,
  transcript: string,
  duration: number,
  riskScore: number,
  issues: ComplianceIssue[]
): Promise<void> => {
  try {
    // Insert call record
    const { error: callError } = await supabase
      .from('calls')
      .insert({
        id: callId,
        call_id: callId,
        started_at: new Date().toISOString(),
        ended_at: new Date(Date.now() + duration * 1000).toISOString(),
        duration_sec: duration,
        risk_score: riskScore,
        status: 'completed'
      });
    
    if (callError) {
      console.error('Error inserting call:', callError);
      throw new Error(`Failed to insert call: ${callError.message}`);
    }
    
    // Insert issues if any
    if (issues.length > 0) {
      const issueRecords = issues.map(issue => ({
        call_id: callId,
        category: issue.category,
        severity: issue.severity,
        rationale: issue.rationale,
        reg_reference: issue.reg_reference,
        timestamp: issue.timestamp,
        evidence_snippet: issue.evidence_snippet,
        evidence_start_ms: issue.evidence_start_ms,
        evidence_end_ms: issue.evidence_end_ms,
        model_rationale: issue.model_rationale,
        model_version: issue.model_version
      }));
      
      const { error: issuesError } = await supabase
        .from('issues')
        .insert(issueRecords);
      
      if (issuesError) {
        console.error('Error inserting issues:', issuesError);
        throw new Error(`Failed to insert issues: ${issuesError.message}`);
      }
    }
    
    console.log(`Successfully inserted call ${callId} with ${issues.length} issues`);
  } catch (error) {
    console.error('Database insertion error:', error);
    throw error;
  }
};

// Export types
export type { AnalyzeRequest, AnalyzeResponse };