import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from '@/lib/audioUtils';
import { useToast } from '@/hooks/use-toast';
import { ttsService } from '@/services/textToSpeech';

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
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasSpokenWelcome = useRef(false);
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
    return new Promise<void>((resolve, reject) => {
      try {
        console.log('🔄 Attempting to connect to realtime compliance service...');
        
        const wsUrl = 'wss://lrofbumospouflcegtbc.functions.supabase.co/functions/v1/realtime-compliance';
        console.log('🌐 WebSocket URL:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = async () => {
          console.log('✅ Connected to realtime compliance WebSocket');
          setIsConnected(true);
          toast({
            title: "Connected",
            description: "Real-time compliance monitoring is active",
          });

          // Welcome message disabled to prevent conflict with OpenAI Realtime API
          // The OpenAI Realtime API will handle the initial greeting
          resolve(); // Resolve the promise when connection is established
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
          case 'response.output_audio.delta':
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
          case 'response.output_audio_transcript.delta':
            // Handle streaming text transcript
            setCurrentTranscript(prev => prev + (data.delta || ''));
            break;

          case 'response.audio_transcript.done':
          case 'response.output_audio_transcript.done':
            // Add complete transcript to messages
            const transcript = data.transcript || currentTranscript.trim();
            console.log('🎯 AI transcript received:', transcript);
            if (transcript) {
              console.log('📝 Adding AI message to conversation');
              setMessages(prev => {
                const newMessages = [...prev, {
                  role: 'assistant' as const,
                  content: transcript,
                  timestamp: new Date().toISOString(),
                  type: 'text' as const
                }];
                console.log('💬 Updated messages array:', newMessages);
                return newMessages;
              });
              setCurrentTranscript('');
            }
            break;

          case 'input_audio_buffer.speech_started':
            console.log('User started speaking');
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('User stopped speaking - analyzing for compliance violations');
            // Check recent messages for compliance violations as fallback
            checkForComplianceViolations();
            break;

          case 'compliance_issue':
            // Handle compliance violation detected with enhanced logging
            const issue = data.issue;
            console.log('🚨 COMPLIANCE ISSUE DETECTED:', {
              category: issue.category,
              severity: issue.severity,
              rationale: issue.rationale,
              evidence: issue.evidenceSnippet,
              regulation: issue.reg_reference
            });
            setComplianceIssues(prev => {
              const newIssues = [...prev, issue];
              console.log('📋 Updated compliance issues count:', newIssues.length);
              return newIssues;
            });
            
            toast({
              title: `${issue.severity.toUpperCase()} Compliance Issue`,
              description: `${issue.category}: ${issue.rationale.substring(0, 100)}...`,
              variant: issue.severity === 'critical' || issue.severity === 'high' ? 'destructive' : 'default',
            });

            // TTS disabled to prevent conflict with OpenAI Realtime API
            // The OpenAI assistant will handle all voice responses
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

          case 'response.output_audio.done':
          case 'response.content_part.done':
          case 'conversation.item.done':
          case 'response.output_item.done':
          case 'response.done':
          case 'rate_limits.updated':
            // Handle completion events - these are just status updates
            console.log(`Status update: ${data.type}`);
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
        reject(new Error('WebSocket connection failed'));
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        setIsRecording(false);
        if (event.code !== 1000) {
          reject(new Error(`WebSocket closed unexpectedly: ${event.reason}`));
        }
      };

    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish real-time connection",
        variant: "destructive",
      });
      reject(error);
    }
    });
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
    setIsAgentSpeaking(false);
    hasSpokenWelcome.current = false;
  }, []);

  // Fallback compliance checking for transcript text
  const checkForComplianceViolations = useCallback(() => {
    console.log('🔍 Running fallback compliance check on recent messages...');
    
    // Get recent user messages from last 10 seconds
    const recentMessages = messages.filter(msg => 
      msg.role === 'user' && 
      Date.now() - new Date(msg.timestamp).getTime() < 10000
    );

    const recentText = recentMessages.map(msg => msg.content).join(' ').toLowerCase();
    console.log('📝 Recent text to analyze:', recentText);

    // Define aggressive compliance patterns
    const compliancePatterns = [
      {
        patterns: ['make you money', 'make money', 'guarantee profit', 'guaranteed return'],
        category: 'Performance Guarantees',
        severity: 'critical' as const,
        rationale: 'Financial advisor making explicit performance guarantees',
        regulation: 'SEC Rule 10b-5'
      },
      {
        patterns: ['only problem', 'problem.*buy more', 'should.*buy more', 'buy everything'],
        category: 'Unsuitable Advice',
        severity: 'critical' as const,
        rationale: 'Recommending excessive investment without suitability analysis',
        regulation: 'FINRA Rule 2111'
      },
      {
        patterns: ['blue chip.*kodak', 'kodak.*blue chip', 'sure thing', 'can\'t lose'],
        category: 'Risk Misrepresentation',
        severity: 'medium' as const,
        rationale: 'Misrepresenting investment risks or outdated advice',
        regulation: 'SEC Rule 10b-5'
      },
      {
        patterns: ['go for it', 'let\'s do it', 'surprise', 'wife.*divorce'],
        category: 'Pressure Tactics',
        severity: 'medium' as const,
        rationale: 'Using pressure tactics or emotional manipulation',
        regulation: 'FINRA Rule 2010'
      }
    ];

    // Check each pattern
    compliancePatterns.forEach(rule => {
      rule.patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const match = recentText.match(regex);
        
        if (match) {
          console.log(`🚨 FALLBACK COMPLIANCE VIOLATION DETECTED: ${pattern} in "${recentText}"`);
          
          const issue = {
            category: rule.category,
            severity: rule.severity,
            rationale: rule.rationale,
            evidenceSnippet: match[0],
            reg_reference: rule.regulation,
            timestamp: new Date().toISOString()
          };
          
          // Add to compliance issues
          setComplianceIssues(prev => {
            const newIssues = [...prev, issue];
            console.log('📋 Added fallback compliance issue, total count:', newIssues.length);
            return newIssues;
          });
          
          // Show toast
          toast({
            title: `${rule.severity.toUpperCase()} Compliance Issue`,
            description: `${rule.category}: ${rule.rationale.substring(0, 100)}...`,
            variant: ['critical', 'high'].includes(rule.severity) ? 'destructive' : 'default',
          });
        }
      });
    });
  }, [messages, toast]);

  // Debug function to test compliance detection
  const addTestCompliance = useCallback((testIssue: ComplianceIssue) => {
    console.log('🧪 Adding test compliance issue:', testIssue);
    setComplianceIssues(prev => [...prev, testIssue]);
    
    toast({
      title: `${testIssue.severity.toUpperCase()} Compliance Issue`,
      description: `${testIssue.category}: ${testIssue.rationale.substring(0, 100)}...`,
      variant: testIssue.severity === 'critical' || testIssue.severity === 'high' ? 'destructive' : 'default',
    });
  }, [toast]);

  return {
    isConnected,
    isRecording,
    messages,
    complianceIssues,
    guidance,
    currentTranscript,
    responseAudio,
    isAgentSpeaking,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    resetSession,
    addTestCompliance, // Debug function
  };
};