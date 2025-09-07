import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, AlertCircle, BookOpen, Clock, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface EvidenceLensProps {
  isOpen: boolean;
  onClose: () => void;
  issue: {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reg_reference: string;
    evidence_snippet?: string;
    evidence_start_ms?: number;
    evidence_end_ms?: number;
    model_rationale?: string;
    rationale?: string;
  } | null;
}

const RISKY_PHRASES = [
  'guarantee', 'guaranteed', 'risk-free', 'sure thing', 'certain',
  'promise', 'never lose', 'always', 'without risk', 'safe bet',
  'no risk', 'zero risk', 'assured', 'definite', 'absolute'
];

const highlightRiskyPhrases = (text: string) => {
  if (!text) return text;
  
  let highlightedText = text;
  RISKY_PHRASES.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    highlightedText = highlightedText.replace(
      regex, 
      `<mark class="bg-gradient-to-r from-red-400/40 to-pink-400/40 text-red-900 dark:text-red-100 px-1.5 py-0.5 rounded-md border border-red-300/60 shadow-lg shadow-red-500/20 font-medium animate-pulse backdrop-blur-sm">$&</mark>`
    );
  });
  
  return highlightedText;
};

const getSeverityGlow = (severity: string) => {
  switch (severity) {
    case 'critical': return 'shadow-red-500/30 border-red-400/50';
    case 'high': return 'shadow-orange-500/30 border-orange-400/50';
    case 'medium': return 'shadow-yellow-500/30 border-yellow-400/50';
    case 'low': return 'shadow-blue-500/30 border-blue-400/50';
    default: return 'shadow-gray-500/30 border-gray-400/50';
  }
};

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40';
    case 'high': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40';
    case 'medium': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/40';
    case 'low': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40';
    default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  }
};

const formatTimestamp = (ms?: number) => {
  if (!ms) return 'Unknown';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const EvidenceLens = ({ isOpen, onClose, issue }: EvidenceLensProps) => {
  const { toast } = useToast();
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  
  if (!issue) return null;

  const handleJumpToTimestamp = () => {
    if (issue.evidence_start_ms) {
      console.log('Jumping to timestamp:', issue.evidence_start_ms, 'ms');
      console.log('Time range:', formatTimestamp(issue.evidence_start_ms), '-', formatTimestamp(issue.evidence_end_ms));
      toast({
        title: "Timestamp Jump",
        description: `Jumped to ${formatTimestamp(issue.evidence_start_ms)}`,
      });
    }
  };

  const handleCopySnippet = async () => {
    if (issue.evidence_snippet) {
      try {
        // Strip HTML tags for clean copy
        const cleanText = issue.evidence_snippet.replace(/<[^>]*>/g, '');
        await navigator.clipboard.writeText(cleanText);
        setCopiedSnippet(true);
        toast({
          title: "Evidence Copied",
          description: "Evidence snippet copied to clipboard",
        });
        setTimeout(() => setCopiedSnippet(false), 2000);
      } catch (err) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy evidence snippet",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl border-2 ${getSeverityGlow(issue.severity)} backdrop-blur-sm bg-background/95`}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Evidence Analysis
            </DialogTitle>
            <Badge className={getSeverityBadgeColor(issue.severity)}>
              {issue.severity.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Category */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-primary">Issue Category</h3>
              </div>
              <p className="text-lg font-medium">{issue.category}</p>
            </CardContent>
          </Card>

          {/* Evidence Snippet */}
          {issue.evidence_snippet && (
            <Card className={`border-2 ${getSeverityGlow(issue.severity)} bg-gradient-to-br from-background to-muted/20`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Evidence</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopySnippet}
                      className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-secondary/30 hover:from-secondary/20 hover:to-secondary/30 transition-all"
                    >
                      {copiedSnippet ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedSnippet ? "Copied!" : "Copy"}
                    </Button>
                    {issue.evidence_start_ms && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleJumpToTimestamp}
                        className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 hover:from-primary/20 hover:to-primary/30 transition-all"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {formatTimestamp(issue.evidence_start_ms)}
                      </Button>
                    )}
                  </div>
                </div>
                <div 
                  className="text-base leading-relaxed p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightRiskyPhrases(issue.evidence_snippet) 
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Why Flagged */}
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="h-5 w-5 text-accent-foreground" />
                <h3 className="font-semibold">Why This Was Flagged</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Analysis</h4>
                  <p className="text-sm leading-relaxed">
                    {issue.model_rationale || issue.rationale || 'No detailed rationale available.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Regulatory Reference</h4>
                  <Badge variant="outline" className="font-mono text-xs bg-gradient-to-r from-secondary/50 to-secondary/30">
                    {issue.reg_reference}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 hover:from-primary/20 hover:to-primary/30"
            >
              Close Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};