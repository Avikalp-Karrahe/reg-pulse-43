import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseSpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

export const useSpeechRecognition = (
  onFinalTranscript?: (transcript: string) => void
): UseSpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(interimTranscript);

        if (finalTranscript && onFinalTranscript) {
          onFinalTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      setIsListening(false);
    }
  }, [isSupported, onFinalTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
    isSupported,
  };
};