import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Zap, Users, Clock, AlertTriangle } from 'lucide-react';
import { demoStore } from '@/demo/demoStore';
import { useAgentOps } from '@/hooks/useAgentOps';
import { useToast } from '@/hooks/use-toast';
import rulesData from '@/demo/rules.json';

interface PresenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Predefined demo phrases with severity mappings
const DEMO_PHRASES = [
  {
    id: 1,
    text: "You'll make 20% monthly, guaranteed.",
    severity: 'high' as const,
    category: 'Performance Guarantees',
    regulation: 'SEC Rule 10b-5',
    hotkey: '1'
  },
  {
    id: 2,
    text: "This is perfect for everyone.",
    severity: 'medium' as const,
    category: 'Unsuitable Advice',
    regulation: 'FINRA Rule 2111',
    hotkey: '2'
  },
  {
    id: 3,
    text: "Transfer money now.",
    severity: 'medium' as const,
    category: 'Pressure/Urgency',
    regulation: 'UDAAP Guidelines',
    hotkey: '3'
  },
  {
    id: 4,
    text: "Best in market.",
    severity: 'low' as const,
    category: 'Risk Disclosure',
    regulation: 'FTC Guides',
    hotkey: '4'
  }
];

export const PresenterPanel = ({ isOpen, onClose }: PresenterPanelProps) => {
  const [customText, setCustomText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptTime, setTranscriptTime] = useState<Date>(new Date());
  
  const { logRuleMatch, logAgentClassify, logEscalation } = useAgentOps();
  const { toast } = useToast();

  // Update transcript time every second when panel is open
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setTranscriptTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  const analyzeText = async (text: string, phraseData?: typeof DEMO_PHRASES[0]) => {
    setIsProcessing(true);
    
    try {
      // Add transcript entry
      const transcriptEntry = {
        id: `presenter-${Date.now()}`,
        text,
        timestamp: new Date(),
        isRisky: true,
        speaker: 'advisor'
      };
      
      demoStore.addTranscriptEntry(transcriptEntry);
      
      // Analyze against demo rules
      const matchedRules = rulesData.filter(rule => {
        const textLower = text.toLowerCase();
        return rule.keywords.some(keyword => textLower.includes(keyword.toLowerCase())) ||
               rule.patterns.some(pattern => {
                 try {
                   const regex = new RegExp(pattern, 'i');
                   return regex.test(text);
                 } catch {
                   return false;
                 }
               });
      });

      // Use phrase data if provided, otherwise find best match
      let ruleToUse;
      if (phraseData) {
        ruleToUse = rulesData.find(rule => rule.category === phraseData.category) || matchedRules[0];
      } else {
        ruleToUse = matchedRules[0];
      }

      if (ruleToUse || phraseData) {
        const rule = ruleToUse || {
          name: phraseData?.category || 'Custom Analysis',
          severity: phraseData?.severity || 'medium',
          regulation: phraseData?.regulation || 'General Compliance',
          description: 'Custom compliance violation detected'
        };

        // Create issue
        const issue = {
          id: `presenter-issue-${Date.now()}`,
          call_id: 'presenter-session',
          category: rule.name,
          severity: rule.severity,
          rationale: `Detected: "${text.substring(0, 50)}..." - ${rule.description || 'Compliance violation'}`,
          reg_reference: rule.regulation,
          timestamp: new Date().toISOString(),
          evidence_snippet: text,
          evidence_start_ms: Date.now() % 60000, // Mock timestamp within current minute
          evidence_end_ms: (Date.now() % 60000) + text.length * 100, // Estimate based on text length
          model_rationale: `Pattern matching and AI classification flagged this statement`,
          model_version: 'presenter-demo-v1',
          user_id: 'demo-presenter',
          organization_id: 'demo-org'
        };

        demoStore.addIssue(issue);

        // Log rule match
        logRuleMatch(
          rule.name,
          text,
          rule.severity as 'low' | 'medium' | 'high' | 'critical',
          rule.regulation,
          Math.floor(Math.random() * 50) + 10
        );

        // Log AI classification
        logAgentClassify(
          'gpt-4o-mini',
          Math.floor(text.length * 0.75) + 50, // Estimate tokens
          `Compliance violation detected: ${rule.name}`,
          Math.floor(Math.random() * 800) + 200
        );

        // Escalate if high severity
        if (rule.severity === 'high' || rule.severity === 'critical') {
          logEscalation(
            'slack#risk-alerts',
            text.substring(0, 100),
            `https://app.compliance.com/issues/${issue.id}`,
            Math.floor(Math.random() * 200) + 50
          );
          
          toast({
            title: "High Risk Detected",
            description: `${rule.name} violation escalated to Slack`,
            variant: "destructive"
          });
        }

        toast({
          title: "Analysis Complete",
          description: `Found ${rule.severity} severity issue: ${rule.name}`,
          variant: rule.severity === 'low' ? "default" : "destructive"
        });
      } else {
        // No rules matched, still log AI classification
        logAgentClassify(
          'gpt-4o-mini',
          Math.floor(text.length * 0.75) + 50,
          'No compliance violations detected in this text',
          Math.floor(Math.random() * 800) + 200
        );
        
        toast({
          title: "Analysis Complete",
          description: "No compliance violations detected",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze text",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhraseClick = async (phrase: typeof DEMO_PHRASES[0]) => {
    await analyzeText(phrase.text, phrase);
  };

  const handleCustomSubmit = async () => {
    if (!customText.trim()) return;
    await analyzeText(customText.trim());
    setCustomText('');
  };

  const handleReplayScript = async () => {
    toast({
      title: "Automated Demo Started",
      description: "Playing compliance violation sequence...",
    });

    for (let i = 0; i < DEMO_PHRASES.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await handlePhraseClick(DEMO_PHRASES[i]);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle hotkeys 1-4
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        e.preventDefault();
        const phrase = DEMO_PHRASES.find(p => p.id === num);
        if (phrase) {
          handlePhraseClick(phrase);
        }
      }
      
      // Handle Enter for custom text
      if (e.key === 'Enter' && e.target === document.querySelector('textarea[data-presenter="true"]')) {
        e.preventDefault();
        handleCustomSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, customText]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l border-border shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Presenter Panel</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Inject Phrases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Inject
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEMO_PHRASES.map((phrase) => (
              <div key={phrase.id} className="space-y-2">
                <Button
                  onClick={() => handlePhraseClick(phrase)}
                  disabled={isProcessing}
                  className="w-full justify-start text-left h-auto p-3"
                  variant="outline"
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {phrase.hotkey}
                      </Badge>
                      <Badge 
                        variant={phrase.severity === 'high' ? 'destructive' : phrase.severity === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {phrase.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{phrase.text}</span>
                    <span className="text-xs text-muted-foreground">{phrase.category}</span>
                  </div>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom Text Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-blue-500" />
              Custom Text Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              data-presenter="true"
              placeholder="Type any phrase to simulate compliance analysis..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              onClick={handleCustomSubmit}
              disabled={!customText.trim() || isProcessing}
              className="w-full"
            >
              Analyze Text (Enter)
            </Button>
          </CardContent>
        </Card>

        {/* Automated Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Automated Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleReplayScript}
              disabled={isProcessing}
              className="w-full"
              variant="secondary"
            >
              Replay Script Sequence
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={isProcessing ? "default" : "outline"}>
                  {isProcessing ? "Processing..." : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transcript Time:</span>
                <div className="flex items-center gap-1 text-sm font-mono">
                  <Clock className="w-3 h-3" />
                  {transcriptTime.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};