import rulesConfigData from './rules.json';
import type { TranscriptSegment } from '@/api/transcribe';
import { demoStore } from '@/demo/demoStore';

interface ComplianceRule {
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  regulation: string;
  patterns: string[];
  description: string;
  rationale: string;
}

interface RulesConfig {
  compliance_rules: Record<string, ComplianceRule>;
  severity_weights: Record<string, number>;
  risk_thresholds: Record<string, number>;
}

const rulesConfig = rulesConfigData as RulesConfig;

interface RuleMatch {
  ruleId: string;
  rule: ComplianceRule;
  matches: {
    pattern: string;
    text: string;
    segment?: TranscriptSegment;
    confidence: number;
  }[];
}

interface ComplianceIssue {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  reg_reference: string;
  timestamp: string;
  evidence_snippet: string | null;
  evidence_start_ms: number | null;
  evidence_end_ms: number | null;
  model_rationale: string;
  model_version: string;
}

class RuleMatcher {
  private rules: Record<string, ComplianceRule>;
  private severityWeights: Record<string, number>;
  
  constructor() {
    this.rules = rulesConfig.compliance_rules as Record<string, ComplianceRule>;
    this.severityWeights = rulesConfig.severity_weights;
  }
  
  /**
   * Analyze transcript segments for compliance violations
   */
  analyzeTranscript(segments: TranscriptSegment[]): {
    issues: ComplianceIssue[];
    riskScore: number;
    matches: RuleMatch[];
  } {
    const allMatches: RuleMatch[] = [];
    const fullText = segments.map(s => s.text).join(' ').toLowerCase();
    
    // Check each rule against the transcript
    Object.entries(this.rules).forEach(([ruleId, rule]) => {
      const ruleMatches = this.matchRule(ruleId, rule, segments, fullText);
      if (ruleMatches.matches.length > 0) {
        allMatches.push(ruleMatches);
        
        // Log tool call for agent ops console
        const bestMatch = ruleMatches.matches[0];
        this.logRuleMatch(rule.name, bestMatch.text, rule.severity, rule.regulation);
      }
    });
    
    // Convert matches to compliance issues
    const issues = this.convertMatchesToIssues(allMatches);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(issues);
    
    return {
      issues,
      riskScore,
      matches: allMatches
    };
  }
  
  /**
   * Match a single rule against transcript segments
   */
  private matchRule(
    ruleId: string, 
    rule: ComplianceRule, 
    segments: TranscriptSegment[], 
    fullText: string
  ): RuleMatch {
    const matches: RuleMatch['matches'] = [];
    
    rule.patterns.forEach(pattern => {
      const regex = new RegExp(pattern.toLowerCase(), 'gi');
      
      // Check full text for pattern
      const fullTextMatches = Array.from(fullText.matchAll(regex));
      
      fullTextMatches.forEach(match => {
        // Find which segment contains this match
        const matchPosition = match.index || 0;
        let currentPosition = 0;
        let matchingSegment: TranscriptSegment | undefined;
        
        for (const segment of segments) {
          const segmentLength = segment.text.length;
          if (matchPosition >= currentPosition && matchPosition < currentPosition + segmentLength) {
            matchingSegment = segment;
            break;
          }
          currentPosition += segmentLength + 1; // +1 for space
        }
        
        // Extract context around the match
        const contextStart = Math.max(0, matchPosition - 50);
        const contextEnd = Math.min(fullText.length, matchPosition + pattern.length + 50);
        const context = fullText.substring(contextStart, contextEnd);
        
        matches.push({
          pattern,
          text: context,
          segment: matchingSegment,
          confidence: this.calculatePatternConfidence(pattern, match[0])
        });
      });
    });
    
    return {
      ruleId,
      rule,
      matches
    };
  }
  
  /**
   * Calculate confidence score for pattern match
   */
  private calculatePatternConfidence(pattern: string, match: string): number {
    // Exact match gets highest confidence
    if (pattern.toLowerCase() === match.toLowerCase()) {
      return 0.95;
    }
    
    // Partial matches get lower confidence
    const similarity = match.length / pattern.length;
    return Math.max(0.7, similarity * 0.9);
  }
  
  /**
   * Convert rule matches to compliance issues
   */
  private convertMatchesToIssues(matches: RuleMatch[]): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    
    matches.forEach(match => {
      // Group matches by rule to avoid duplicate issues
      if (match.matches.length > 0) {
        const bestMatch = match.matches.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        const issue: ComplianceIssue = {
          category: match.rule.name,
          severity: match.rule.severity,
          rationale: match.rule.rationale,
          reg_reference: match.rule.regulation,
          timestamp: new Date().toISOString(),
          evidence_snippet: bestMatch.text,
          evidence_start_ms: bestMatch.segment?.start || null,
          evidence_end_ms: bestMatch.segment?.end || null,
          model_rationale: `Deterministic pattern match for "${bestMatch.pattern}" with ${Math.round(bestMatch.confidence * 100)}% confidence`,
          model_version: 'rules-engine-v1.0'
        };
        
        issues.push(issue);
      }
    });
    
    return issues;
  }
  
  /**
   * Calculate overall risk score based on issues
   */
  private calculateRiskScore(issues: ComplianceIssue[]): number {
    if (issues.length === 0) return 0;
    
    const totalWeight = issues.reduce((sum, issue) => {
      return sum + (this.severityWeights[issue.severity] || 1);
    }, 0);
    
    // Normalize to 0-100 scale
    const maxPossibleWeight = issues.length * this.severityWeights.critical;
    const normalizedScore = (totalWeight / maxPossibleWeight) * 100;
    
    return Math.min(100, Math.max(0, normalizedScore));
  }
  
  /**
   * Get risk level based on score
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = rulesConfig.risk_thresholds;
    
    if (score >= thresholds.critical) return 'critical';
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Log rule match to agent ops console
   */
  private logRuleMatch(
    ruleName: string,
    phrase: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    regReference: string
  ) {
    const latencyMs = Math.floor(Math.random() * 50) + 10;
    
    const toolCall = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      tool: 'rules.match' as const,
      status: 'success' as const,
      duration_ms: latencyMs,
      duration: latencyMs,
      input: {
        rule_name: ruleName,
        phrase: phrase.substring(0, 100),
        severity,
        reg_reference: regReference
      },
      output: {
        match_confidence: 0.85 + Math.random() * 0.14,
        evidence_length: phrase.length,
        context_score: Math.random() * 0.3 + 0.7
      }
    };

    demoStore.addToolCall(toolCall);
  }
}

// Export singleton instance
export const ruleMatcher = new RuleMatcher();
export type { ComplianceIssue, RuleMatch, ComplianceRule };