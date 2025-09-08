import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceWidgetProps {
  className?: string;
}

export const VoiceWidget = ({ className }: VoiceWidgetProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsConnected(true);
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[event.results.length - 1].isFinal) {
          handleUserInput(transcript);
        }
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleUserInput = async (transcript: string) => {
    console.log('User said:', transcript);
    
    // Simulate AI response - you can replace this with actual AI API call
    const responses = [
      "I'm Ivy, your AI compliance assistant. How can I help you with regulatory compliance today?",
      "I can help you understand compliance requirements, review potential violations, and provide guidance on best practices.",
      "Based on your query, I recommend reviewing the latest regulatory guidelines and implementing proper monitoring procedures.",
      "Let me analyze that for you. This appears to be within compliance guidelines, but I recommend additional documentation for audit purposes."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Speak the response
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4 p-6", className)}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
        )} />
        <span>
          {isConnected ? 'Connected to Ivy' : 'Initializing...'}
        </span>
      </div>

      {/* Main Voice Button */}
      <div className="relative">
        <Button
          onClick={toggleListening}
          size="lg"
          variant={isListening ? "default" : "outline"}
          className={cn(
            "w-20 h-20 rounded-full transition-all duration-300",
            isListening && "bg-emerald-500 hover:bg-emerald-600 animate-pulse",
            isSpeaking && "bg-cyan-500 hover:bg-cyan-600"
          )}
          disabled={!isConnected}
        >
          {isListening ? (
            <Mic className="w-8 h-8" />
          ) : (
            <MicOff className="w-8 h-8" />
          )}
        </Button>
        
        {/* Listening Animation Ring */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping" />
        )}
        
        {/* Speaking Animation Ring */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-pulse" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-sm font-medium text-emerald-400">
          {isSpeaking ? 'Ivy is speaking...' : 
           isListening ? 'Listening...' : 
           'Tap to talk to Ivy'}
        </p>
        {isSpeaking && (
          <Button
            onClick={stopSpeaking}
            variant="ghost"
            size="sm"
            className="mt-2 text-xs"
          >
            <VolumeX className="w-3 h-3 mr-1" />
            Stop
          </Button>
        )}
      </div>

      {/* Instructions */}
      {!isListening && !isSpeaking && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Press and hold to ask about compliance requirements, regulations, or get AI-powered guidance.
        </p>
      )}
    </div>
  );
};