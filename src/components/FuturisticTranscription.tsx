import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, MessageSquare } from "lucide-react";

interface TranscriptLine {
  id: string;
  text: string;
  timestamp: Date;
  isRisky: boolean;
  riskPhrase?: string;
}

interface FuturisticTranscriptionProps {
  callId: string;
  content: string;
  isListening: boolean;
  issues: Array<{
    category: string;
    severity: string;
    rationale: string;
    timestamp: string;
  }>;
}

export const FuturisticTranscription = ({ 
  callId, 
  content, 
  isListening,
  issues 
}: FuturisticTranscriptionProps) => {
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>("");

  useEffect(() => {
    if (content && content !== lastContentRef.current) {
      const newText = content.replace(lastContentRef.current, "").trim();
      if (newText) {
        // Check if this text contains risky phrases from recent issues
        const recentIssues = issues.slice(-3);
        let isRisky = false;
        let riskPhrase = "";
        
        for (const issue of recentIssues) {
          // Simple check - in a real app you'd have more sophisticated matching
          const keywords = issue.rationale.toLowerCase().split(" ").slice(0, 3);
          for (const keyword of keywords) {
            if (keyword.length > 3 && newText.toLowerCase().includes(keyword)) {
              isRisky = true;
              riskPhrase = keyword;
              break;
            }
          }
          if (isRisky) break;
        }

        const newLine: TranscriptLine = {
          id: `${Date.now()}-${Math.random()}`,
          text: newText,
          timestamp: new Date(),
          isRisky,
          riskPhrase
        };

        setTranscriptLines(prev => [...prev, newLine]);
      }
      lastContentRef.current = content;
    }
  }, [content, issues]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageSquare className="w-5 h-5 text-neon-cyan neon-glow" />
          <span className="text-foreground">Live Transcription</span>
          <Badge 
            variant={isListening ? "default" : "outline"}
            className={`ml-auto ${isListening ? 'bg-neon-green/20 text-neon-green border-neon-green animate-pulse-glow' : ''}`}
          >
            {isListening ? (
              <>
                <Mic className="w-3 h-3 mr-1" />
                RECORDING
              </>
            ) : (
              <>
                <MicOff className="w-3 h-3 mr-1" />
                PAUSED
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto space-y-3 scroll-smooth"
          style={{ maxHeight: "calc(100vh - 300px)" }}
        >
          {transcriptLines.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isListening ? "Listening for speech..." : "Start recording to see transcript"}
                </p>
              </div>
            </div>
          ) : (
            transcriptLines.map((line, index) => (
              <div
                key={line.id}
                className={`flex flex-col space-y-1 animate-type-in opacity-0 ${
                  index === transcriptLines.length - 1 ? 'animate-type-in' : 'opacity-100'
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatTime(line.timestamp)}
                  </span>
                  {line.isRisky && (
                    <Badge 
                      variant="destructive" 
                      className="text-xs bg-neon-red/20 text-neon-red border-neon-red animate-pulse-glow"
                    >
                      RISK DETECTED
                    </Badge>
                  )}
                </div>
                <div 
                  className={`p-3 rounded-lg border ${
                    line.isRisky 
                      ? 'bg-destructive/10 border-neon-red/30 text-neon-red neon-glow' 
                      : 'bg-muted/10 border-border/30 text-risk-safe-text'
                  } backdrop-blur-sm`}
                >
                  <p className={`text-sm leading-relaxed ${
                    line.isRisky ? 'font-medium' : ''
                  }`}>
                    {line.text}
                  </p>
                  {line.riskPhrase && (
                    <p className="text-xs text-neon-red/80 mt-1">
                      Flagged phrase: "{line.riskPhrase}"
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};