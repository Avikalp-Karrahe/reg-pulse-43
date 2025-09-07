import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  X, 
  Play, 
  RotateCcw, 
  Keyboard,
  Send,
  Volume2
} from "lucide-react";
import { demoStore } from "@/demo/demoStore";
import { useToast } from "@/hooks/use-toast";
import rules from "@/demo/rules.json";

interface PresenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_PHRASES = [
  {
    id: 1,
    text: "You'll make 20% monthly, guaranteed.",
    severity: "high" as const,
    category: "Performance Guarantees"
  },
  {
    id: 2, 
    text: "This is perfect for everyone.",
    severity: "medium" as const,
    category: "Unsuitable Advice"
  },
  {
    id: 3,
    text: "Transfer money now.",
    severity: "medium" as const,
    category: "Pressure/Urgency"
  },
  {
    id: 4,
    text: "Best in market.",
    severity: "low" as const,
    category: "Risk Disclosure"
  }
];

export const PresenterPanel = ({ isOpen, onClose }: PresenterPanelProps) => {
  const [customText, setCustomText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptTime, setTranscriptTime] = useState(60); // Start at 60 seconds
  const { toast } = useToast();

  // Simulate compliance analysis
  const analyzeText = useCallback(async (text: string, phraseData?: typeof DEMO_PHRASES[0]) => {
    setIsProcessing(true);
    
    // Add transcript entry
    const timestamp = new Date(Date.now() - 5000 + transcriptTime * 1000).toISOString();
    const transcriptEntry = {
      timestamp: `00:${Math.floor(transcriptTime / 60).toString().padStart(2, '0')}:${(transcriptTime % 60).toString().padStart(2, '0')}`,
      speaker: "Advisor",
      text: text,
      hasIssue: !!phraseData,
      issueId: phraseData ? `ISSUE-DEMO-${phraseData.id}` : undefined
    };
    
    demoStore.addTranscriptEntry(transcriptEntry);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    let detectedIssue = null;

    if (phraseData) {
      // Use predefined issue data
      detectedIssue = {
        id: `ISSUE-DEMO-${phraseData.id}`,
        call_id: "CALL-DEMO-LIVE",
        category: phraseData.category,
        severity: phraseData.severity,
        rationale: `Detected ${phraseData.category.toLowerCase()} violation in live conversation.`,
        reg_reference: rules.find(r => r.category === phraseData.category)?.regulation || "Various",
        evidence_snippet: text,
        evidence_start_ms: transcriptTime * 1000,
        evidence_end_ms: (transcriptTime + 3) * 1000,
        model_rationale: `The phrase "${text}" constitutes a compliance violation.`,
        model_version: "demo-v1",
        timestamp: timestamp
      };
    } else {
      // Analyze custom text for patterns
      for (const rule of rules) {
        for (const pattern of rule.patterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(text)) {
            detectedIssue = {
              id: `ISSUE-DEMO-CUSTOM-${Date.now()}`,
              call_id: "CALL-DEMO-LIVE", 
              category: rule.category,
              severity: rule.severity as "low" | "medium" | "high",
              rationale: rule.description,
              reg_reference: rule.regulation,
              evidence_snippet: text,
              evidence_start_ms: transcriptTime * 1000,
              evidence_end_ms: (transcriptTime + 3) * 1000,
              model_rationale: `Pattern match detected for rule: ${rule.name}`,
              model_version: "demo-v1",
              timestamp: timestamp
            };
            break;
          }
        }
        if (detectedIssue) break;
      }
    }

    // Add issue if detected
    if (detectedIssue) {
      demoStore.addIssue(detectedIssue);
      
      // Add tool call log
      demoStore.addToolCall({
        id: `tool-${Date.now()}`,
        timestamp: timestamp,
        tool: "tools/rules.match",
        status: "success",
        duration_ms: 250 + Math.random() * 500,
        input: { phrase: text },
        output: { 
          rule_name: detectedIssue.category,
          severity: detectedIssue.severity,
          reg_reference: detectedIssue.reg_reference,
          confidence: 0.85 + Math.random() * 0.14
        }
      });

      // Show escalation for high severity
      if (detectedIssue.severity === "high") {
        demoStore.addToolCall({
          id: `escalation-${Date.now()}`,
          timestamp: timestamp,
          tool: "tools/notify.escalate",
          status: "success",
          duration_ms: 150 + Math.random() * 300,
          input: { 
            severity: detectedIssue.severity,
            category: detectedIssue.category 
          },
          output: { 
            channel: "slack#risk-alerts",
            message_id: `msg_${Date.now()}`,
            notified_users: ["compliance-team", "manager-alerts"]
          }
        });

        toast({
          title: "Escalated to Slack",
          description: `${detectedIssue.category} violation escalated to #risk-alerts`,
          variant: "default"
        });
      }

      toast({
        title: `${detectedIssue.severity.toUpperCase()} Issue Detected`,
        description: detectedIssue.category,
        variant: detectedIssue.severity === "high" ? "destructive" : "default"
      });
    } else {
      // Add generic analysis tool call
      demoStore.addToolCall({
        id: `analysis-${Date.now()}`,
        timestamp: timestamp,
        tool: "tools/agent.classify",
        status: "success", 
        duration_ms: 800 + Math.random() * 400,
        input: { text },
        output: {
          model: "gpt-4o-mini",
          tokens: 45 + Math.floor(Math.random() * 30),
          classification: "compliant",
          confidence: 0.92
        }
      });
    }

    setTranscriptTime(prev => prev + 4); // Advance time
    setIsProcessing(false);
  }, [transcriptTime, toast]);

  const handlePhraseClick = useCallback((phrase: typeof DEMO_PHRASES[0]) => {
    analyzeText(phrase.text, phrase);
  }, [analyzeText]);

  const handleCustomSubmit = useCallback(() => {
    if (customText.trim()) {
      analyzeText(customText.trim());
      setCustomText("");
    }
  }, [customText, analyzeText]);

  const handleReplayScript = useCallback(async () => {
    toast({
      title: "Replaying Demo Script",
      description: "Running automated compliance scenarios..."
    });

    // Run phrases with delays
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const phrase = DEMO_PHRASES[i];
      await analyzeText(phrase.text, phrase);
    }

    toast({
      title: "Script Complete",
      description: "Demo scenarios finished running"
    });
  }, [analyzeText, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        e.preventDefault();
        handlePhraseClick(DEMO_PHRASES[num - 1]);
      }
      
      if (e.key === 'Enter' && customText.trim()) {
        e.preventDefault();
        handleCustomSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, customText, handlePhraseClick, handleCustomSubmit]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="floating-panel top-4 right-4 w-96 max-h-[80vh] overflow-auto"
        initial={{ opacity: 0, x: 100, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Presenter Panel
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Control live demo scenarios and inject compliance violations
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick phrases */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                Quick Inject (Hotkeys 1-4)
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_PHRASES.map((phrase) => (
                  <Button
                    key={phrase.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePhraseClick(phrase)}
                    disabled={isProcessing}
                    className="justify-start h-auto p-3 text-left"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          "{phrase.text}"
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {phrase.category}
                        </div>
                      </div>
                      <div className="ml-2 flex items-center gap-1">
                        <Badge
                          variant={phrase.severity === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {phrase.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {phrase.id}
                        </span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom text input */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Custom Text Analysis
              </h3>
              <div className="space-y-2">
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type a phrase to analyze for compliance violations..."
                  className="min-h-[60px] text-sm"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim() || isProcessing}
                  size="sm"
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Analyze Text (Enter)
                </Button>
              </div>
            </div>

            {/* Replay script */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Automated Demo
              </h3>
              <Button
                onClick={handleReplayScript}
                disabled={isProcessing}
                variant="outline"
                size="sm" 
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Replay Script (8s sequence)
              </Button>
            </div>

            {/* Status */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Status</span>
                <span className={isProcessing ? "text-cyan-400" : "text-green-400"}>
                  {isProcessing ? "Processing..." : "Ready"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Transcript Time</span>
                <span className="font-mono">
                  {Math.floor(transcriptTime / 60)}:{(transcriptTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};