import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Send, MessageSquare, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dataAdapter } from '@/app/dataAdapter';
import { useToast } from '@/hooks/use-toast';

interface PresenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Scripted demo phrases mapped to hotkeys
const DEMO_PHRASES = {
  1: {
    text: "You'll make 20% monthly, guaranteed.",
    severity: 'HIGH',
    category: 'Performance Guarantees',
    description: 'Explicit guarantee violation'
  },
  2: {
    text: "This investment is perfect for everyone.",
    severity: 'MED', 
    category: 'Unsuitable Advice',
    description: 'Blanket recommendation'
  },
  3: {
    text: "You need to transfer money now.",
    severity: 'MED',
    category: 'Pressure / Urgency', 
    description: 'High-pressure tactics'
  },
  4: {
    text: "We're the best in market with industry-leading returns.",
    severity: 'LOW',
    category: 'Risk Disclosure',
    description: 'Unsubstantiated claims'
  }
} as const;

export const PresenterPanel = ({ isOpen, onClose }: PresenterPanelProps) => {
  const [customText, setCustomText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;
      if (key in DEMO_PHRASES) {
        e.preventDefault();
        handleInjectPhrase(parseInt(key) as keyof typeof DEMO_PHRASES);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInjectPhrase = async (phraseKey: keyof typeof DEMO_PHRASES) => {
    const phrase = DEMO_PHRASES[phraseKey];
    
    setIsAnalyzing(true);
    
    try {
      // Simulate analysis and create issues
      const issues = await dataAdapter.simulateAnalysis(phrase.text);
      
      // Add transcript bubble (trigger custom event)
      window.dispatchEvent(new CustomEvent('transcriptUpdate', {
        detail: {
          text: phrase.text,
          speaker: 'advisor',
          timestamp: Date.now(),
          hasRiskFlag: issues.length > 0
        }
      }));

      // Pulse risk meter
      window.dispatchEvent(new CustomEvent('riskMeterPulse', {
        detail: { severity: phrase.severity }
      }));

      toast({
        title: `Injected: ${phrase.category}`,
        description: `${phrase.severity} severity - ${issues.length} issue(s) detected`,
        variant: phrase.severity === 'HIGH' ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('Failed to inject phrase:', error);
      toast({
        title: 'Injection Failed', 
        description: 'Could not process the demo phrase.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCustomAnalysis = async () => {
    if (!customText.trim()) return;

    setIsAnalyzing(true);
    
    try {
      const issues = await dataAdapter.simulateAnalysis(customText);
      
      // Add transcript bubble
      window.dispatchEvent(new CustomEvent('transcriptUpdate', {
        detail: {
          text: customText,
          speaker: 'advisor',
          timestamp: Date.now(),
          hasRiskFlag: issues.length > 0
        }
      }));

      // Pulse risk meter if issues found
      if (issues.length > 0) {
        const highestSeverity = issues.some(i => i.severity === 'HIGH') ? 'HIGH' : 
                               issues.some(i => i.severity === 'MED') ? 'MED' : 'LOW';
        window.dispatchEvent(new CustomEvent('riskMeterPulse', {
          detail: { severity: highestSeverity }
        }));
      }

      toast({
        title: 'Analysis Complete',
        description: `${issues.length} compliance issue(s) detected`,
        variant: issues.some(i => i.severity === 'HIGH') ? 'destructive' : 'default'
      });

      setCustomText('');
    } catch (error) {
      console.error('Failed to analyze custom text:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not process the custom text.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="w-3 h-3" />;
      case 'MED': return <Shield className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MED': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l border-border shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Presenter Panel</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Hotkey Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Injections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Press number keys 1-4 to inject scripted compliance violations:
              </p>
              
              {Object.entries(DEMO_PHRASES).map(([key, phrase]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleInjectPhrase(parseInt(key) as keyof typeof DEMO_PHRASES)}
                    disabled={isAnalyzing}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {key}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium text-xs">{phrase.category}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {phrase.text}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getSeverityColor(phrase.severity) as any} className="ml-2">
                        {getSeverityIcon(phrase.severity)}
                        <span className="ml-1 text-xs">{phrase.severity}</span>
                      </Badge>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Text Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="Type text to simulate analysis..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomAnalysis();
                    }
                  }}
                  disabled={isAnalyzing}
                />
                <Button
                  onClick={handleCustomAnalysis}
                  disabled={!customText.trim() || isAnalyzing}
                  size="sm"
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-2" />
                      Analyze Text
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Enter compliance phrases to see real-time detection and evidence highlighting.
              </p>
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Toggle Panel:</span>
                  <Badge variant="outline" className="font-mono">P</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Close Panel:</span>
                  <Badge variant="outline" className="font-mono">ESC</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quick Inject:</span>
                  <Badge variant="outline" className="font-mono">1-4</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Analyze Text:</span>
                  <Badge variant="outline" className="font-mono">ENTER</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};