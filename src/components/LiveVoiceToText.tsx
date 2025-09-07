import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff } from "lucide-react";

interface LiveVoiceToTextProps {
  transcript: string;
  isListening: boolean;
  finalTranscripts: string[];
}

export const LiveVoiceToText = ({ 
  transcript, 
  isListening, 
  finalTranscripts 
}: LiveVoiceToTextProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [transcript, finalTranscripts]);

  return (
    <Card className="h-[400px] flex flex-col bg-card/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2 text-cyan-400">
          {isListening ? (
            <Mic className="w-4 h-4 text-green-500" />
          ) : (
            <MicOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span>Live Voice-to-Text</span>
          <div className={`w-2 h-2 rounded-full ml-auto transition-colors ${
            isListening ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
          }`} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div className="p-4 space-y-3 min-h-full">
            {/* Final transcripts (confirmed speech) */}
            {finalTranscripts.map((finalText, index) => (
              <div key={index} className="p-3 bg-card border border-cyan-500/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {finalText}
                </p>
              </div>
            ))}
            
            {/* Current interim transcript (real-time speech) */}
            {transcript && (
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="text-xs text-cyan-400">Speaking...</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  {transcript}
                </p>
              </div>
            )}
            
            {/* Empty state */}
            {!isListening && finalTranscripts.length === 0 && !transcript && (
              <div className="flex-1 flex items-center justify-center text-center h-full">
                <div className="text-muted-foreground">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-cyan-400/50" />
                  <p className="text-sm font-medium">Ready to listen</p>
                  <p className="text-xs mt-1">Start recording to see live voice-to-text transcription</p>
                </div>
              </div>
            )}
            
            {/* Listening indicator */}
            {isListening && !transcript && finalTranscripts.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3 text-cyan-400 bg-cyan-500/10 px-4 py-3 rounded-full border border-cyan-500/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm font-medium">Listening for speech...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};