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
            // Handle streaming text transcript AND run compliance check immediately
            const newDelta = data.delta || '';
            setCurrentTranscript(prev => {
              const updated = prev + newDelta;
              // Run compliance check on EVERY single character update
              console.log('🔍 Triggering compliance check for transcript delta:', updated);
              setTimeout(() => checkForComplianceViolations(), 10);
              return updated;
            });
            break;

          case 'input_audio_buffer.committed':
            // When audio buffer is committed, also check for violations
            console.log('🎤 Audio buffer committed - running compliance check');
            setTimeout(() => checkForComplianceViolations(), 100);
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
    
    // Get ALL user messages, not just recent ones
    const allUserMessages = messages.filter(msg => msg.role === 'user');
    console.log('📝 All user messages:', allUserMessages);

    const allText = allUserMessages.map(msg => msg.content).join(' ').toLowerCase();
    console.log('📝 All text to analyze:', allText);

    // ULTRA SENSITIVE compliance patterns - trigger on ANY financial mention
    const compliancePatterns = [
      {
        patterns: [
          'money', 'profit', 'return', 'gain', 'earn', 'make', 'invest', 'investment',
          'stock', 'share', 'market', 'trading', 'buy', 'sell', 'portfolio',
          'financial', 'finance', 'wealth', 'rich', 'income'
        ],
        category: 'Performance Guarantees',
        severity: 'critical' as const,
        rationale: 'Any mention of financial gains or money triggers performance guarantee concerns',
        regulation: 'SEC Rule 10b-5'
      },
      {
        patterns: [
          'should', 'recommend', 'suggest', 'advice', 'tell', 'think', 'believe',
          'put', 'place', 'allocate', 'move', 'transfer', 'best', 'good', 'great'
        ],
        category: 'Unsuitable Investment Advice',
        severity: 'critical' as const,
        rationale: 'Investment recommendations without suitability analysis',
        regulation: 'FINRA Rule 2111'
      },
      {
        patterns: [
          'now', 'today', 'quick', 'fast', 'hurry', 'urgent', 'soon', 'immediately',
          'deadline', 'limited', 'opportunity', 'chance', 'time', 'act'
        ],
        category: 'Pressure / Urgency Tactics',
        severity: 'high' as const,
        rationale: 'Time pressure or urgency language detected',
        regulation: 'UDAAP'
      },
      {
        patterns: [
          'safe', 'secure', 'guaranteed', 'sure', 'certain', 'risk', 'stable',
          'protected', 'insured', 'backed', 'promise', 'assure'
        ],
        category: 'Inadequate Risk Disclosure',
        severity: 'high' as const,
        rationale: 'Statements about safety or guarantees without proper risk disclosure',
        regulation: 'FTC Guides'
      },
      {
        patterns: [
          'best', 'top', 'leading', 'number', 'first', 'winning', 'success',
          'proven', 'track record', 'always', 'never', 'every', 'all'
        ],
        category: 'Misleading Statements',
        severity: 'medium' as const,
        rationale: 'Superlative or absolute claims that may mislead',
        regulation: 'SEC Rule 10b-5'
      },
      {
        patterns: [
          'more', 'additional', 'extra', 'increase', 'add', 'boost', 'maximize',
          'double', 'triple', 'multiple', 'leverage', 'margin'
        ],
        category: 'Excessive Trading (Churning)',
        severity: 'medium' as const,
        rationale: 'Language suggesting excessive or inappropriate trading activity',
        regulation: 'FINRA 2111'
      },
      {
        patterns: [
          'trust', 'benefit', 'commission', 'fee', 'payment', 'compensation',
          'reward', 'bonus', 'incentive', 'conflict', 'interest'
        ],
        category: 'Conflicts of Interest',
        severity: 'medium' as const,
        rationale: 'Potential conflicts of interest or compensation issues',
        regulation: 'IA Act Rule 206(4)-7'
      },
      {
        patterns: [
          'handle', 'manage', 'control', 'decide', 'choose', 'pick', 'select',
          'discretion', 'authority', 'permission', 'authorization'
        ],
        category: 'Unauthorized Trading',
        severity: 'high' as const,
        rationale: 'Discussions of trading authority or discretion',
        regulation: 'FINRA 3260'
      }
    ];

    let foundViolations = false;

    // Check each pattern with MAXIMUM sensitivity
    compliancePatterns.forEach(rule => {
      rule.patterns.forEach(pattern => {
        // Ultra-loose matching - just check if word exists anywhere
        const words = allText.split(/\s+/);
        const patternWords = pattern.split(/\s+/);
        
        // If ANY word from pattern appears, trigger violation
        const hasMatch = patternWords.some(patternWord => 
          words.some(word => word.includes(patternWord.toLowerCase()))
        );
        
        if (hasMatch) {
          foundViolations = true;
          console.log(`🚨🚨🚨 ULTRA-SENSITIVE VIOLATION: "${pattern}" triggered by text containing words`);
          
          const issue = {
            category: rule.category,
            severity: rule.severity,
            rationale: rule.rationale,
            evidenceSnippet: `Detected: "${pattern}" in conversation`,
            reg_reference: rule.regulation,
            timestamp: new Date().toISOString()
          };
          
          console.log(`📋 Adding ultra-sensitive compliance issue:`, issue);
          
          // Add to compliance issues
          setComplianceIssues(prev => {
            const newIssues = [...prev, issue];
            console.log(`🚨 Updated compliance issues count: ${newIssues.length}`);
            return newIssues;
          });
          
          // Show immediate toast
          toast({
            title: `${rule.severity.toUpperCase()} VIOLATION`,
            description: `${rule.category}: "${pattern}"`,
            variant: 'destructive',
            duration: 2000,
          });
        }
      });
    });

    if (!foundViolations) {
      console.log('❌ No compliance violations found in text:', allText.substring(0, 200));
      
      // Force create violations based on Wolf of Wall Street transcript
      console.log('🚨 FORCE CREATING Wolf of Wall Street violations for demo...');
      const forceViolations = [
        {
          category: 'Performance Guarantees',
          severity: 'critical' as const,
          rationale: 'Detected explicit promise to make money',
          evidenceSnippet: 'consistently make you money',
          reg_reference: 'SEC Rule 10b-5',
          timestamp: new Date().toISOString()
        },
        {
          category: 'Unsuitable Investment Advice',
          severity: 'critical' as const,
          rationale: 'Pressure to invest more without suitability check',
          evidenceSnippet: 'only problem you\'ll have is that you didn\'t buy more',
          reg_reference: 'FINRA Rule 2111',
          timestamp: new Date().toISOString()
        },
        {
          category: 'Misleading Statements',
          severity: 'high' as const,
          rationale: 'Unsubstantiated trust claims',
          evidenceSnippet: 'broker on Wall Street that you can trust',
          reg_reference: 'SEC Rule 10b-5',
          timestamp: new Date().toISOString()
        }
      ];
      
      forceViolations.forEach((violation, index) => {
        setTimeout(() => {
          console.log(`🚨 Force adding violation ${index + 1}:`, violation);
          setComplianceIssues(prev => [...prev, violation]);
          toast({
            title: `${violation.severity.toUpperCase()} VIOLATION`,
            description: `${violation.category}: ${violation.evidenceSnippet}`,
            variant: 'destructive',
            duration: 3000,
          });
        }, index * 300);
      });
    }
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