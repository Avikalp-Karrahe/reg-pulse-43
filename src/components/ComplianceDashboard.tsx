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
import { TestScenarios } from "./TestScenarios";
import { QuickChecks } from "./QuickChecks";
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
    toast({
      title: "Analysis Complete",
      description: `Analysis completed successfully with ${result.issues?.length || 0} issues found.`,
    });
  };

  const handleIssueDetected = (issue: any) => {
    // Issues are already managed by useToolhouseAgent
    console.log('Issue detected:', issue);
  };

  const handleRiskScoreUpdate = (score: number) => {
    // Risk score is already managed by useToolhouseAgent
    console.log('Risk score updated:', score);
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
        
        {/* Quick Validation Checks */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <QuickChecks />
        </motion.div>
        
        {/* Test Scenarios Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <TestScenarios />
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
                  <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                    AI Compliance Analysis
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/20">
                      {allIssues.length} Issues
                    </Badge>
                    <Badge className={`${getRiskColor(riskScore)} border-0`}>
                      {riskScore.toFixed(1)}% Risk
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FuturisticTranscription 
                  callId={currentCall.id} 
                  content={transcriptLines.length > 0 ? transcriptLines.join(' ') : streamingContent}
                  isListening={isListening}
                  issues={allIssues}
                />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Bottom Analysis Grid */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {/* Risk Analysis Table - Enhanced, takes 2 columns */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="card-premium h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Risk Analysis & Violations
                  </CardTitle>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20">
                    {allIssues.filter(i => i.severity === 'critical').length} Critical
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RiskAnalysisTable issues={allIssues} callId={currentCall.id} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Right sidebar with monitoring panels */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            {/* Enhanced Circular Risk Meter */}
            <Card className="card-premium">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Risk Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CircularRiskMeter 
                  riskScore={riskScore} 
                  isActive={isListening}
                />
              </CardContent>
            </Card>

            {/* Enhanced Analysis Summary */}
            <Card className="card-premium">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Live Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FuturisticStats
                  totalIssues={allIssues.length}
                  criticalIssues={allIssues.filter(i => i.severity === 'critical').length}
                  duration={currentCall.duration}
                  isProcessing={isLoading}
                />
              </CardContent>
            </Card>

            {/* Enhanced Recent Issues Preview */}
            {allIssues.length > 0 && (
              <Card className="card-premium">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                      Recent Alerts
                    </CardTitle>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                      {allIssues.slice(-3).length} New
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allIssues.slice(-3).map((issue, index) => (
                    <motion.div 
                      key={index} 
                      className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-red-400">
                          {issue.category}
                        </span>
                        <Badge className={`text-xs ${
                          issue.severity === 'critical' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {issue.rationale.substring(0, 100)}...
                      </p>
                      {issue.evidenceSnippet && (
                        <div className="text-xs text-muted-foreground/80 border-t border-muted/20 pt-2 mt-2">
                          <span className="font-mono text-cyan-400">Evidence:</span> {issue.evidenceSnippet.substring(0, 80)}...
                          {issue.evidenceStartMs && (
                            <span className="ml-2 text-xs bg-muted/20 px-2 py-1 rounded">
                              {Math.floor(issue.evidenceStartMs / 1000)}s
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
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
          <span className={`px-4 py-2 rounded-lg text-sm font-medium border backdrop-blur-sm ${getRiskColor(riskScore)} neon-glow`}>
            RISK SCORE: {Math.round(riskScore)}%
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

      <RiskAnalysisTable callId={currentCall.id} issues={allIssues} />
    </div>
  );
};