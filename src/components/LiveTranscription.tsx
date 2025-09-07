import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, User, UserCheck } from "lucide-react";

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'advisor' | 'client';
  timestamp: string;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface LiveTranscriptionProps {
  callId: string;
}

export const LiveTranscription = ({ callId }: LiveTranscriptionProps) => {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isListening, setIsListening] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock real-time transcription - only start when call is active
  useEffect(() => {
    if (!callId || callId.includes('undefined')) return;
    
    const mockTranscriptData = [
      {
        text: "Good morning, thank you for calling our investment advisory service. How can I help you today?",
        speaker: 'advisor' as const,
        riskLevel: 'safe' as const,
      },
      {
        text: "Hi, I'm interested in learning about investment opportunities. I've heard about high-return investments.",
        speaker: 'client' as const,
        riskLevel: 'safe' as const,
      },
      {
        text: "I'd be happy to discuss our investment options with you. We offer a range of products suitable for different risk profiles.",
        speaker: 'advisor' as const,
        riskLevel: 'safe' as const,
      },
      {
        text: "What kind of returns can I expect? I'm looking for something that can give me at least 15% annually.",
        speaker: 'client' as const,
        riskLevel: 'low' as const,
      },
      {
        text: "Well, I understand you're looking for strong returns. While I can't guarantee specific percentages, some of our growth portfolios have historically performed well.",
        speaker: 'advisor' as const,
        riskLevel: 'medium' as const,
      },
      {
        text: "Can you guarantee those returns? I really need this to work out.",
        speaker: 'client' as const,
        riskLevel: 'low' as const,
      },
      {
        text: "I can almost guarantee you'll see returns like that based on our track record. This is a sure thing.",
        speaker: 'advisor' as const,
        riskLevel: 'critical' as const,
      },
      {
        text: "That sounds great! What's the minimum investment?",
        speaker: 'client' as const,
        riskLevel: 'safe' as const,
      },
      {
        text: "You should invest as much as possible to maximize your gains. Maybe liquidate some of your other investments?",
        speaker: 'advisor' as const,
        riskLevel: 'high' as const,
      }
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTranscriptData.length) {
        const entry = mockTranscriptData[index];
        const newEntry: TranscriptEntry = {
          id: `${callId}-${index}`,
          text: entry.text,
          speaker: entry.speaker,
          timestamp: new Date().toLocaleTimeString(),
          riskLevel: entry.riskLevel,
          confidence: Math.random() * 0.3 + 0.7
        };
        
        setTranscript(prev => [...prev, newEntry]);
        index++;
      } else {
        clearInterval(interval);
        setIsListening(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [callId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [transcript]);

  const getRiskStyles = (riskLevel: string, speaker: string) => {
    // Only apply risk colors to advisor messages, client messages stay white
    if (speaker === 'client') {
      return 'bg-white text-gray-800 shadow-sm border border-gray-200';
    }
    
    switch (riskLevel) {
      case 'safe':
        return 'bg-risk-safe text-risk-safe-text shadow-sm';
      case 'low':
        return 'bg-risk-low text-risk-low-text shadow-sm';
      case 'medium':
        return 'bg-risk-medium text-risk-medium-text shadow-sm';
      case 'high':
        return 'bg-risk-high text-risk-high-text shadow-md';
      case 'critical':
        return 'bg-risk-critical text-risk-critical-text shadow-lg border border-red-300';
      default:
        return 'bg-muted text-muted-foreground shadow-sm';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300 font-semibold';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          {isListening ? (
            <Mic className="w-4 h-4 text-green-500" />
          ) : (
            <MicOff className="w-4 h-4 text-gray-500" />
          )}
          <span>Live Transcript</span>
          <div className={`w-2 h-2 rounded-full ml-auto ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div className="p-3 space-y-2 min-h-full flex flex-col">
            <div className="flex-1"></div>
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`flex ${entry.speaker === 'advisor' ? 'justify-start' : 'justify-end'} px-1`}
              >
                <div className={`max-w-[75%] rounded-2xl p-3 break-words ${getRiskStyles(entry.riskLevel, entry.speaker)}`}>
                  <div className="flex items-center space-x-2 mb-1 flex-wrap">
                    {entry.speaker === 'advisor' ? (
                      <UserCheck className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <User className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="font-medium text-xs flex-shrink-0">
                      {entry.speaker === 'advisor' ? 'Advisor' : 'Client'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {entry.timestamp}
                    </span>
                    
                    {entry.speaker === 'advisor' && (
                      <Badge className={`${getRiskBadgeColor(entry.riskLevel)} flex-shrink-0`} variant="outline">
                        <span className="text-xs">{entry.riskLevel.charAt(0).toUpperCase()}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm leading-relaxed word-wrap break-words">
                    {entry.text}
                  </p>
                </div>
              </div>
            ))}
            
            {isListening && (
              <div className="flex justify-center py-2">
                <div className="flex items-center space-x-2 text-muted-foreground p-3 bg-muted/30 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs italic">Listening...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};