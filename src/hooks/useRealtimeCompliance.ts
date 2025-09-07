import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from '@/lib/audioUtils';
import { useToast } from '@/hooks/use-toast';

interface ComplianceIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  evidenceSnippet: string;
  reg_reference: string;
  timestamp: string;
}

interface ComplianceGuidance {
  warning_type: 'preventive' | 'corrective' | 'educational';
  guidance: string;
  timestamp: string;
}

interface RealtimeMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  type: 'text' | 'audio';
}

export const useRealtimeCompliance = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [guidance, setGuidance] = useState<ComplianceGuidance[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [responseAudio, setResponseAudio] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      console.log('🔄 Attempting to connect to realtime compliance service...');
      
      const wsUrl = 'wss://lrofbumospouflcegtbc.functions.supabase.co/functions/v1/realtime-compliance';
      console.log('🌐 WebSocket URL:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Connected to realtime compliance WebSocket');
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Real-time compliance monitoring is active",
        });
      };

      wsRef.current.onmessage = async (event) => {
        console.log('Received message:', event.data);
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'session.created':
            console.log('Session created');
            break;

          case 'session.updated':
            console.log('Session updated:', data);
            break;

          case 'response.audio.delta':
            // Handle streaming audio response
            if (audioContextRef.current && data.delta) {
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              await playAudioData(audioContextRef.current, bytes);
            }
            break;

          case 'response.audio_transcript.delta':
            // Handle streaming text transcript
            setCurrentTranscript(prev => prev + (data.delta || ''));
            break;

          case 'response.audio_transcript.done':
            // Add complete transcript to messages
            if (currentTranscript.trim()) {
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: currentTranscript.trim(),
                timestamp: new Date().toISOString(),
                type: 'text'
              }]);
              setCurrentTranscript('');
            }
            break;

          case 'input_audio_buffer.speech_started':
            console.log('User started speaking');
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('User stopped speaking');
            break;

          case 'compliance_issue':
            // Handle compliance violation detected
            const issue = data.issue;
            console.log('Compliance issue detected:', issue);
            setComplianceIssues(prev => [...prev, issue]);
            
            toast({
              title: `${issue.severity.toUpperCase()} Compliance Issue`,
              description: `${issue.category}: ${issue.rationale.substring(0, 100)}...`,
              variant: issue.severity === 'critical' || issue.severity === 'high' ? 'destructive' : 'default',
            });
            break;

          case 'compliance_guidance':
            // Handle real-time guidance
            const guidanceData = data.guidance;
            console.log('Compliance guidance received:', guidanceData);
            setGuidance(prev => [...prev, guidanceData]);
            
            toast({
              title: "Compliance Guidance",
              description: guidanceData.guidance,
            });
            break;

          case 'error':
            console.error('WebSocket error:', data.message);
            toast({
              title: "Connection Error",
              description: data.message,
              variant: "destructive",
            });
            break;

          default:
            console.log('Unhandled message type:', data.type);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        console.error('WebSocket error event details:', JSON.stringify(error));
        setIsConnected(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to compliance monitoring service. Please check your internet connection and try again.",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        setIsRecording(false);
      };

    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish real-time connection",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Not Connected",
        description: "Please connect to the service first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting audio recording...');
      
      // Clear any existing audio queue
      clearAudioQueue();

      const recorder = new AudioRecorder((audioData) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64Audio = encodeAudioForAPI(audioData);
          const message = {
            type: 'input_audio_buffer.append',
            audio: base64Audio
          };
          wsRef.current.send(JSON.stringify(message));
        }
      });

      await recorder.start();
      audioRecorderRef.current = recorder;
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Real-time compliance monitoring is active",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    console.log('Stopping audio recording...');
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    setIsRecording(false);
    
    toast({
      title: "Recording Stopped",
      description: "Compliance monitoring session ended",
    });
  }, [toast]);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('Sending text message:', text);

    // Add user message to history
    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      type: 'text'
    }]);

    // Send to OpenAI
    const createMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    const createResponse = {
      type: 'response.create'
    };

    wsRef.current.send(JSON.stringify(createMessage));
    wsRef.current.send(JSON.stringify(createResponse));
  }, []);

  const disconnect = useCallback(() => {
    console.log('Disconnecting from realtime compliance...');
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsRecording(false);
    clearAudioQueue();
  }, []);

  const resetSession = useCallback(() => {
    setMessages([]);
    setComplianceIssues([]);
    setGuidance([]);
    setCurrentTranscript('');
    setResponseAudio('');
  }, []);

  return {
    isConnected,
    isRecording,
    messages,
    complianceIssues,
    guidance,
    currentTranscript,
    responseAudio,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    resetSession,
  };
};