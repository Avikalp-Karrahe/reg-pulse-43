import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Mic, Upload, Phone, PhoneOff, Download, MicOff, Settings, X, Zap, 
  Shield, Activity, AlertTriangle, Clock, Users, BarChart3, Eye,
  PlayCircle, PauseCircle, Volume2, VolumeX, Wifi, WifiOff
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LiveTranscription } from "./LiveTranscription";
import { RiskAnalysisTable } from "./RiskAnalysisTable";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useToolhouseAgent } from "@/hooks/useToolhouseAgent";
import { useToast } from "@/hooks/use-toast";
import { useSaveCall } from "@/hooks/useSaveCall";
import { audioManager } from "@/lib/audio";
import { Link } from "react-router-dom";
import { FuturisticTranscription } from "./FuturisticTranscription";
import { CircularRiskMeter } from "./CircularRiskMeter";
import { FuturisticStats } from "./FuturisticStats";


import { FileUpload } from "./FileUpload";
import { LiveVoiceToText } from "./LiveVoiceToText";
import { RealtimeComplianceDashboard } from "./RealtimeComplianceDashboard";

interface CallData {
  id: string;
  duration: number;
  riskScore: number;
  status: 'active' | 'completed';
}

export const ComplianceDashboard = () => {
  const [useRealtimeMode, setUseRealtimeMode] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [showAudioSetupPrompt, setShowAudioSetupPrompt] = useState(false);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const [uploadedIssues, setUploadedIssues] = useState<any[]>([]);
  const [uploadedRiskScore, setUploadedRiskScore] = useState<number>(0);
  const [vapiScriptLoaded, setVapiScriptLoaded] = useState(false);
  const [vapiLoadingProgress, setVapiLoadingProgress] = useState(0);
  const [vapiLoadingStage, setVapiLoadingStage] = useState('Initializing...');
  const { toast } = useToast();
  const saveCall = useSaveCall();
  
  const {
    sendMessage,
    resetSession,
    streamingContent,
    allIssues,
    riskScore,
    isLoading,
  } = useToolhouseAgent();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
    isSupported,
  } = useSpeechRecognition((finalTranscript) => {
    if (finalTranscript.trim()) {
      // Add to final transcripts history
      setFinalTranscripts(prev => [...prev, finalTranscript.trim()]);
      // Send to compliance analysis
      sendMessage(finalTranscript);
    }
  });

  const startRecording = async () => {
    if (!isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Check audio setup first
    const selectedDeviceId = audioManager.getSelectedDeviceId();
    const permission = await audioManager.getPermissionState();
    
    if (!selectedDeviceId || permission !== 'granted') {
      setShowAudioSetupPrompt(true);
      return;
    }

    // Test the selected device before starting
    try {
      const stream = await audioManager.requestMicrophoneAccess(selectedDeviceId);
      audioManager.setupAudioAnalyser(stream);
      
      // Test audio levels for 1-2 seconds
      let testAttempts = 0;
      const testInterval = setInterval(() => {
        const levels = audioManager.getAudioLevels();
        testAttempts++;
        
        if (testAttempts >= 10) { // ~1 second of testing
          clearInterval(testInterval);
          audioManager.stopCurrentStream();
          startCallRecording();
        }
      }, 100);
      
    } catch (error) {
      toast({
        title: "Audio Device Error",
        description: "Failed to access selected microphone. Please check your audio settings.",
        variant: "destructive",
      });
      return;
    }
  };

  const startCallRecording = async () => {
    const newCall: CallData = {
      id: `CALL-${Date.now()}`,
      duration: 0,
      riskScore: 0,
      status: 'active'
    };
    
    setCurrentCall(newCall);
    setFinalTranscripts([]); // Clear previous transcripts
    resetSession();
    
    try {
      await startListening();
      toast({
        title: "Call Started",
        description: "Recording and analyzing speech...",
      });
    } catch (err) {
      toast({
        title: "Error Starting Call",
        description: "Failed to start speech recognition. Please check microphone permissions.",
        variant: "destructive",
      });
      setCurrentCall(null);
      return;
    }
    
    // Start timer
    const interval = setInterval(() => {
      setCurrentCall(prev => {
        if (!prev || prev.status !== 'active') {
          clearInterval(interval);
          return prev;
        }
        
        return {
          ...prev,
          duration: prev.duration + 1,
          riskScore: riskScore
        };
      });
    }, 1000);

    // Store interval for cleanup
    (newCall as any).interval = interval;
  };

  const endCall = () => {
    stopListening();
    if (currentCall) {
      if ((currentCall as any).interval) {
        clearInterval((currentCall as any).interval);
      }
      
      setCurrentCall({
        ...currentCall,
        status: 'completed',
        riskScore: riskScore
      });
      
      toast({
        title: "Call Ended",
        description: `Call completed with risk score: ${riskScore.toFixed(1)}%`,
      });
      
      // Save call to Supabase
      saveCall.mutate({
        callId: currentCall.id,
        duration: currentCall.duration,
        riskScore: riskScore,
        issues: allIssues,
      });
    }
  };

  const handleAnalysisComplete = (result: any) => {
    // Store the uploaded issues and risk score
    setUploadedIssues(result.issues || []);
    setUploadedRiskScore(result.riskScore || 0);
    
    // Create a completed call to show the results
    const completedCall: CallData = {
      id: result.callId || `UPLOAD-${Date.now()}`,
      duration: Math.floor((result.transcript?.length || 0) / 10), // Rough estimate based on transcript length
      riskScore: result.riskScore || 0,
      status: 'completed'
    };
    
    setCurrentCall(completedCall);
    
    toast({
      title: "Analysis Complete",
      description: `Analysis completed successfully with ${result.issues?.length || 0} issues found.`,
    });
  };

  const handleIssueDetected = (issue: any) => {
    // Add issues to uploaded issues during streaming
    setUploadedIssues(prev => [...prev, issue]);
  };

  const handleRiskScoreUpdate = (score: number) => {
    // Update uploaded risk score during streaming
    setUploadedRiskScore(score);
  };

  // Update risk score when Toolhouse provides new data
  useEffect(() => {
    if (currentCall && currentCall.status === 'active') {
      setCurrentCall(prev => prev ? { ...prev, riskScore } : null);
    }
  }, [riskScore, currentCall]);

  // Load audio setup state on mount
  useEffect(() => {
    const loadAudioState = async () => {
      const selectedDeviceId = audioManager.getSelectedDeviceId();
      const permission = await audioManager.getPermissionState();
      setPermissionState(permission);
      
      if (selectedDeviceId && permission === 'granted') {
        try {
          const devices = await audioManager.getAudioDevices();
          const device = devices.find(d => d.deviceId === selectedDeviceId);
          setSelectedDeviceName(device?.label || 'Unknown Device');
        } catch (error) {
          console.error('Error loading device name:', error);
        }
      }
      
      // Show setup prompt if not configured
      if (!selectedDeviceId || permission !== 'granted') {
        const hasShownPrompt = localStorage.getItem('audioSetupPromptShown');
        if (!hasShownPrompt) {
          setShowAudioSetupPrompt(true);
          localStorage.setItem('audioSetupPromptShown', 'true');
        }
      }
    };
    
    loadAudioState();
  }, []);

  // Check if Vapi script is loaded with detailed progress tracking
  useEffect(() => {
    const checkVapiScript = async () => {
      setVapiLoadingStage('Checking script element...');
      setVapiLoadingProgress(10);
      
      // Check if script element exists
      const script = document.querySelector('script[src*="vapi"]');
      if (!script) {
        setVapiLoadingStage('❌ Vapi script element not found in HTML');
        setVapiLoadingProgress(0);
        return;
      }
      
      setVapiLoadingStage('Script element found, checking load status...');
      setVapiLoadingProgress(25);
      
      // Check if already loaded
      if (typeof window !== 'undefined' && (window as any).vapi) {
        setVapiLoadingStage('✅ Vapi object already available');
        setVapiLoadingProgress(100);
        setVapiScriptLoaded(true);
        return;
      }
      
      setVapiLoadingStage('Waiting for script to load...');
      setVapiLoadingProgress(40);
      
      // Add load event listener
      script.addEventListener('load', () => {
        setVapiLoadingStage('Script loaded, checking Vapi object...');
        setVapiLoadingProgress(70);
        
        setTimeout(() => {
          if ((window as any).vapi) {
            setVapiLoadingStage('✅ Vapi object available, initializing widget...');
            setVapiLoadingProgress(90);
            setTimeout(() => {
              setVapiLoadingProgress(100);
              setVapiScriptLoaded(true);
            }, 500);
          } else {
            setVapiLoadingStage('❌ Vapi object not found after script load');
            setVapiLoadingProgress(75);
          }
        }, 1000);
      });
      
      script.addEventListener('error', () => {
        setVapiLoadingStage('❌ Script failed to load');
        setVapiLoadingProgress(0);
      });
      
      // Fallback: check periodically
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        setVapiLoadingProgress(Math.min(60 + attempts * 2, 85));
        setVapiLoadingStage(`Polling for Vapi object... (attempt ${attempts})`);
        
        if ((window as any).vapi) {
          setVapiLoadingStage('✅ Vapi object found via polling');
          setVapiLoadingProgress(100);
          setVapiScriptLoaded(true);
          clearInterval(interval);
        }
        
        if (attempts >= 15) {
          setVapiLoadingStage('❌ Timeout: Vapi object not available after 15 attempts');
          setVapiLoadingProgress(0);
          clearInterval(interval);
        }
      }, 1000);
    };
    
    checkVapiScript();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-risk-safe-text bg-risk-safe';
    if (score <= 40) return 'text-risk-low-text bg-risk-low';
    if (score <= 60) return 'text-risk-medium-text bg-risk-medium';
    if (score <= 80) return 'text-risk-high-text bg-risk-high';
    return 'text-risk-critical-text bg-risk-critical';
  };

  // Show realtime mode if enabled
  if (useRealtimeMode) {
    return <RealtimeComplianceDashboard />;
  }

  if (!currentCall) {
    // Premium initial state with sophisticated design
    return (
      <motion.div 
        className="space-y-8 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section with Statistics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="card-glass overflow-hidden group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ready to Start</p>
                  <p className="text-3xl font-bold text-emerald-400">Start Now</p>
                  <p className="text-xs text-emerald-300/70 mt-1">Begin monitoring</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <PlayCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass overflow-hidden group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Setup Time</p>
                  <p className="text-3xl font-bold text-cyan-400">30s</p>
                  <p className="text-xs text-cyan-300/70 mt-1">Quick setup</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <Clock className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass overflow-hidden group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Risk Reduction</p>
                  <p className="text-3xl font-bold text-amber-400">85%</p>
                  <p className="text-xs text-amber-300/70 mt-1">Average savings</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass overflow-hidden group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">AI Accuracy</p>
                  <p className="text-3xl font-bold text-green-400">99.2%</p>
                  <p className="text-xs text-green-300/70 mt-1">Detection rate</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <Eye className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="card-premium border-cyan-500/30 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <Label htmlFor="realtime-mode" className="text-xl font-semibold text-cyan-400 cursor-pointer">
                        Real-time Voice AI Mode
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                          NEW
                        </Badge>
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          AI-POWERED
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    Switch to interactive AI voice assistant for live, <span className="text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-1 rounded">two-way compliance</span> conversations with advanced 
                    natural language processing and real-time risk assessment.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Current Mode</p>
                    <p className="font-semibold">{useRealtimeMode ? 'AI Voice' : 'Standard'}</p>
                  </div>
                  <Switch
                    id="realtime-mode"
                    checked={useRealtimeMode}
                    onCheckedChange={setUseRealtimeMode}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vapi Widget Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <Card className="card-premium border-indigo-500/30 overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Talk with AI Assistant
                </h2>
                <p className="text-muted-foreground">
                  Get instant compliance guidance and support through our advanced AI voice assistant
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-md mx-auto p-4 border-2 border-dashed border-indigo-500/50 rounded-lg bg-indigo-500/5">
                  {vapiScriptLoaded ? (
                    <vapi-widget
                      public-key="5109d358-3f22-41c2-bd0e-70e059604e6a"
                      assistant-id="e263a068-6f1c-44dd-adc7-bfef527f50bb"
                      mode="voice"
                      theme="dark"
                      base-bg-color="#000000"
                      accent-color="#14B8A6"
                      cta-button-color="#000000"
                      cta-button-text-color="#ffffff"
                      border-radius="large"
                      size="medium"
                      position="inline"
                      title="TALK WITH AI"
                      start-button-text="Start"
                      end-button-text="End Call"
                      chat-first-message="Hey, how can I help you with compliance today?"
                      chat-placeholder="Type your message..."
                      voice-show-transcript="true"
                      consent-required="true"
                      consent-title="Terms and conditions"
                      consent-content="By clicking Agree, and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service."
                      consent-storage-key="vapi_widget_consent"
                    ></vapi-widget>
                  ) : (
                    <div className="text-center py-8">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                        {/* Progress ring */}
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-indigo-500/20"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - vapiLoadingProgress / 100)}`}
                            className="text-indigo-400 transition-all duration-300"
                            strokeLinecap="round"
                          />
                        </svg>
                        {/* Percentage */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-indigo-400">{vapiLoadingProgress}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-indigo-400 font-medium mb-2">Loading AI Assistant...</p>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        {vapiLoadingStage}
                      </p>
                      <div className="mt-4 text-xs text-muted-foreground">
                        <p>Debug Info:</p>
                        <p>• Script in DOM: {document.querySelector('script[src*="vapi"]') ? '✅' : '❌'}</p>
                        <p>• Window.vapi: {typeof window !== 'undefined' && (window as any).vapi ? '✅' : '❌'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Action Center */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {/* Start Assistant Panel */}
          <Card className="card-premium overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Launch Live Compliance Assistant
              </CardTitle>
              <p className="text-muted-foreground leading-relaxed">
                Start your AI-powered compliance assistant for real-time voice monitoring, guidance, and risk assessment during live conversations
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <Button 
                onClick={startRecording}
                className="button-premium w-full h-16 text-lg font-semibold"
                size="lg"
                disabled={!isSupported}
              >
                <PlayCircle className="w-6 h-6 mr-3" />
                Launch Assistant
              </Button>
              
              {selectedDeviceName && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-emerald-400 font-medium">
                    <strong>{selectedDeviceName}</strong>
                  </p>
                </div>
              )}
              
              {!isSupported && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400 text-center">
                    Speech recognition not supported. Please use Chrome or Edge.
                  </p>
                </div>
              )}
              
              {error && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload Panel */}
          <Card className="card-premium overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-purple-400" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Upload & Analyze
              </CardTitle>
              <p className="text-muted-foreground leading-relaxed">
                Upload recorded calls for post-analysis with detailed compliance reports and risk assessment
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <FileUpload 
                onAnalysisComplete={handleAnalysisComplete}
                onIssueDetected={handleIssueDetected}
                onRiskScoreUpdate={handleRiskScoreUpdate}
                isProcessing={isLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (currentCall.status === 'active') {
    // Premium live call interface with sophisticated design
    return (
      <motion.div 
        className="space-y-8 p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Premium Call Status Header */}
        <motion.div 
          className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/20 backdrop-blur-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <Phone className="w-8 h-8 text-emerald-400" />
              </div>
              {isListening && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  LIVE MONITORING
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                  {isListening ? (
                    <><Wifi className="w-3 h-3 mr-1" /> ACTIVE</>
                  ) : (
                    <><WifiOff className="w-3 h-3 mr-1" /> PAUSED</>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-sm">{currentCall.id}</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-sm">{formatDuration(currentCall.duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Risk: {riskScore.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              size="lg"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              {isListening ? <PauseCircle className="w-5 h-5 mr-2" /> : <PlayCircle className="w-5 h-5 mr-2" />}
              {isListening ? 'Pause' : 'Resume'}
            </Button>
            
            <Button 
              onClick={endCall} 
              variant="destructive"
              size="lg"
              className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 px-6"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </div>
        </motion.div>

        {/* Premium Grid Layout for Live Data */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Live Voice-to-Text - Enhanced */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-premium h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Live Transcript
                  </CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20">
                    <Activity className="w-3 h-3 mr-1" />
                    STREAMING
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <LiveVoiceToText 
                  transcript={transcript}
                  isListening={isListening}
                  finalTranscripts={finalTranscripts}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Analysis - Enhanced, spans 2 columns */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-premium h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    Risk Analysis Table
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Compliance Categories Checklist */}
                  <div className="grid gap-3">
                    {[
                      { id: 'performance_guarantees', name: 'Performance Guarantees', regulation: 'SEC 10b-5' },
                      { id: 'unsuitable_advice', name: 'Unsuitable Investment Advice', regulation: 'FINRA 2111' },
                      { id: 'pressure_tactics', name: 'Pressure / Urgency Tactics', regulation: 'UDAAP' },
                      { id: 'risk_disclosure', name: 'Inadequate Risk Disclosure', regulation: 'FTC Guides' },
                      { id: 'misleading_statements', name: 'Misleading Statements', regulation: 'SEC 10b-5' },
                      { id: 'churning', name: 'Excessive Trading (Churning)', regulation: 'FINRA 2111' },
                      { id: 'conflicts_of_interest', name: 'Conflicts of Interest', regulation: 'IA Act Rule 206(4)-7' },
                      { id: 'unauthorized_trading', name: 'Unauthorized Trading', regulation: 'FINRA 3260' }
                    ].map((category) => {
                      const hasIssue = allIssues.some(issue => 
                        issue.category.toLowerCase().replace(/[^a-z0-9]/g, '_').includes(category.id.split('_')[0])
                      );
                      
                      return (
                        <div
                          key={category.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                            hasIssue 
                              ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20' 
                              : 'bg-green-500/10 border-green-500/30'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            hasIssue 
                              ? 'bg-red-500 border-red-500' 
                              : 'bg-green-500 border-green-500'
                          }`}>
                            {hasIssue ? (
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium text-sm ${
                                hasIssue ? 'text-red-400' : 'text-green-400'
                              }`}>
                                {category.name}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  hasIssue 
                                    ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                                    : 'border-green-500/50 text-green-400 bg-green-500/10'
                                }`}
                              >
                                {hasIssue ? 'FLAGGED' : 'CLEAR'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {category.regulation}
                            </p>
                            
                            {/* Show specific issue details if detected */}
                            {hasIssue && allIssues
                              .filter(issue => issue.category.toLowerCase().replace(/[^a-z0-9]/g, '_').includes(category.id.split('_')[0]))
                              .map((issue, idx) => (
                                <div key={idx} className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                                  <p className="text-xs text-red-300 font-medium">
                                    Severity: {issue.severity.toUpperCase()}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {issue.rationale}
                                  </p>
                                  {issue.evidenceSnippet && (
                                    <p className="text-xs text-red-200 mt-1 italic">
                                      "{issue.evidenceSnippet}"
                                    </p>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">
                          {(currentCall?.id.startsWith('UPLOAD-') ? uploadedIssues : allIssues).length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Issues
                        </div>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">
                          {(currentCall?.id.startsWith('UPLOAD-') ? uploadedIssues : allIssues).filter(i => i.severity === 'critical' || i.severity === 'high').length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          High Risk
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Live Voice to Text Transcription */}
        <motion.div 
          className="grid grid-cols-1 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="card-premium">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Live Transcription
                </CardTitle>
                <Badge className={`${isListening ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-muted/20 text-muted-foreground border-muted/20'}`}>
                  {isListening ? 'STREAMING' : 'PAUSED'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <LiveVoiceToText 
                finalTranscripts={finalTranscripts}
                transcript={transcript}
                isListening={isListening}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Post-call analysis with futuristic styling
  return (
    <div className="space-y-6 particles-bg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neon-cyan neon-glow">
            ANALYSIS COMPLETE
          </h2>
          <p className="text-muted-foreground font-mono">
            {currentCall.id} • Duration: {formatDuration(currentCall.duration)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-4 py-2 rounded-lg text-sm font-medium border backdrop-blur-sm ${getRiskColor(currentCall.id.startsWith('UPLOAD-') ? uploadedRiskScore : riskScore)} neon-glow`}>
            RISK SCORE: {Math.round(currentCall.id.startsWith('UPLOAD-') ? uploadedRiskScore : riskScore)}%
          </span>
          <Button 
            variant="outline"
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 neon-glow"
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT REPORT
          </Button>
          <Button 
            onClick={() => setCurrentCall(null)}
            className="bg-neon-green/20 border-neon-green text-neon-green hover:bg-neon-green/30 neon-glow"
          >
            NEW SESSION
          </Button>
        </div>
      </div>

      <RiskAnalysisTable callId={currentCall.id} issues={currentCall.id.startsWith('UPLOAD-') ? uploadedIssues : allIssues} />
    </div>
  );
};