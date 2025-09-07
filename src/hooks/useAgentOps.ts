import { useCallback } from 'react';
import { demoStore, type ToolCall } from '@/demo/demoStore';

export const useAgentOps = () => {
  const logRuleMatch = useCallback((
    ruleName: string,
    phrase: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    regReference: string,
    latencyMs: number = Math.floor(Math.random() * 50) + 10
  ) => {
    const toolCall: ToolCall = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      tool: 'rules.match',
      action: 'analyze',
      status: 'success',
      latency_ms: latencyMs,
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
  }, []);

  const logAgentClassify = useCallback((
    model: string,
    tokens: number,
    rationale: string,
    latencyMs: number = Math.floor(Math.random() * 800) + 200
  ) => {
    const toolCall: ToolCall = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      tool: 'agent.classify',
      action: 'classify',
      status: 'success',
      latency_ms: latencyMs,
      input: {
        model,
        tokens,
        context_length: Math.floor(tokens * 0.8),
        temperature: 0.3
      },
      output: {
        rationale: rationale.substring(0, 200),
        confidence: 0.75 + Math.random() * 0.24,
        token_usage: tokens,
        cost_usd: (tokens / 1000) * 0.002
      }
    };

    demoStore.addToolCall(toolCall);
  }, []);

  const logEscalation = useCallback((
    channel: string,
    snippet: string,
    link: string,
    latencyMs: number = Math.floor(Math.random() * 200) + 50
  ) => {
    const toolCall: ToolCall = {
      id: `escalate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      tool: 'notify.escalate',
      action: 'escalate',
      status: 'success',
      latency_ms: latencyMs,
      input: {
        channel,
        snippet: snippet.substring(0, 150),
        link,
        priority: 'high'
      },
      output: {
        message_id: `msg_${Math.random().toString(36).substr(2, 16)}`,
        delivered_at: new Date().toISOString(),
        recipients: Math.floor(Math.random() * 5) + 2
      }
    };

    demoStore.addToolCall(toolCall);
  }, []);

  return {
    logRuleMatch,
    logAgentClassify,
    logEscalation
  };
};