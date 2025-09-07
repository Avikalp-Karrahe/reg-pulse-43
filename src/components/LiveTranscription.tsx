import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface LiveTranscriptionProps {
  callId: string;
  content: string;
  isListening: boolean;
}

export const LiveTranscription = ({ callId, content, isListening }: LiveTranscriptionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [content]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          {isListening ? (
            <Mic className="w-4 h-4 text-green-500" />
          ) : (
            <MicOff className="w-4 h-4 text-gray-500" />
          )}
          <span>Live Analysis</span>
          <div className={`w-2 h-2 rounded-full ml-auto ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div className="p-3 space-y-2 min-h-full flex flex-col">
            {content ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    // Style JSON code blocks differently
                    code: ({ className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isJson = match && match[1] === 'json';
                      const isInline = !className;
                      
                      if (!isInline && isJson) {
                        return (
                          <div className="bg-red-50 border border-red-200 rounded p-2 my-2">
                            <div className="text-xs font-semibold text-red-800 mb-1">⚠️ Compliance Issue Detected</div>
                            <pre className="text-xs text-red-700 whitespace-pre-wrap">
                              {children}
                            </pre>
                          </div>
                        );
                      }
                      
                      return isInline ? (
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                          <code>{children}</code>
                        </pre>
                      );
                    },
                    // Style paragraphs
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-2 text-foreground">
                        {children}
                      </p>
                    ),
                    // Style headers
                    h1: ({ children }) => (
                      <h1 className="text-base font-semibold mb-2 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold mb-2 text-foreground">
                        {children}
                      </h2>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <p className="text-sm">Waiting for speech...</p>
                  <p className="text-xs mt-1">Start speaking to see real-time compliance analysis</p>
                </div>
              </div>
            )}
            
            {isListening && (
              <div className="flex justify-center py-2">
                <div className="flex items-center space-x-2 text-muted-foreground p-3 bg-muted/30 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs italic">Listening & Analyzing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};