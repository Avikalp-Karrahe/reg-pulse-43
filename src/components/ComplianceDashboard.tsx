import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Upload, Phone, PhoneOff, Download, MicOff, Settings, X } from "lucide-react";
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

interface CallData {
  id: string;
  duration: number;
  riskScore: number;
  status: 'active' | 'completed';
}

export const ComplianceDashboard = () => {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [showAudioSetupPrompt, setShowAudioSetupPrompt] = useState(false);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
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

  const handleUploadTranscription = async (transcript: string, duration: number) => {
    const newCall: CallData = {
      id: `CALL-${Date.now()}`,
      duration: 0,
      riskScore: 0,
      status: 'active'
    };
    
    setCurrentCall(newCall);
    setTranscriptLines([]);
    resetSession();
    
    // Process transcript in segments for better visualization
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segmentDelay = Math.min(2000, Math.max(500, duration * 1000 / sentences.length));
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence) {
        setTimeout(() => {
          setTranscriptLines(prev => [...prev, sentence]);
          sendMessage(sentence);
        }, i * segmentDelay);
      }
    }
    
    // End call after processing
    setTimeout(async () => {
      const finalCall: CallData = {
        ...newCall,
        duration: duration,
        riskScore: riskScore,
        status: 'completed'
      };
      
      setCurrentCall(finalCall);
      
      // Save call to Supabase
      saveCall.mutate({
        callId: newCall.id,
        duration: duration,
        riskScore: riskScore,
        issues: allIssues,
      });
      
      toast({
        title: "Upload Complete",
        description: `Recording analyzed successfully. Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      });
    }, sentences.length * segmentDelay + 1000);
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

  if (!currentCall) {
    // Initial clean state
    return (
      <div className="space-y-6">
        {/* Audio Setup Prompt */}
        {showAudioSetupPrompt && (
          <Alert>
            <Settings className="w-4 h-4" />
            <AlertTitle>Audio Input Setup Required</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Configure your microphone and virtual audio cable for optimal compliance monitoring.</span>
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/settings">Open Audio Setup</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAudioSetupPrompt(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Start Compliance Monitoring</CardTitle>
              <p className="text-muted-foreground text-sm">
                Record and analyze calls for regulatory compliance using real-time AI
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={startRecording}
                className="w-full h-12 text-base"
                size="lg"
                disabled={!isSupported}
              >
                <Mic className="w-5 h-5 mr-2" />
                Call Agent
              </Button>
              
              {selectedDeviceName && (
                <p className="text-xs text-center text-muted-foreground">
                  Using: <strong>{selectedDeviceName}</strong>
                </p>
              )}
              
              {!isSupported && (
                <p className="text-sm text-muted-foreground text-center">
                  Speech recognition not supported. Please use Chrome or Edge.
                </p>
              )}
              
              {error && (
                <p className="text-sm text-destructive text-center">
                  {error}
                </p>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <FileUpload 
                onTranscriptionComplete={handleUploadTranscription}
                isProcessing={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentCall.status === 'active') {
    // Live call interface with futuristic design
    return (
      <div className="space-y-6 particles-bg">
        {/* Call status header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              {isListening ? (
                <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse neon-glow" />
              ) : (
                <div className="w-3 h-3 bg-muted rounded-full" />
              )}
              <span className="text-neon-cyan neon-glow">LIVE MONITORING</span>
            </h2>
            <p className="text-muted-foreground font-mono">
              {currentCall.id} • {formatDuration(currentCall.duration)}
            </p>
          </div>
          
          <Button 
            onClick={endCall} 
            variant="destructive"
            className="bg-neon-red/20 border-neon-red text-neon-red hover:bg-neon-red/30 neon-glow"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            TERMINATE
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Live Transcription - Takes 2 columns */}
          <div className="lg:col-span-2">
            <FuturisticTranscription 
              callId={currentCall.id} 
              content={transcriptLines.length > 0 ? transcriptLines.join(' ') : streamingContent}
              isListening={isListening}
              issues={allIssues}
            />
          </div>

          {/* Right sidebar with monitoring panels */}
          <div className="space-y-6">
            {/* Circular Risk Meter */}
            <CircularRiskMeter 
              riskScore={riskScore} 
              isActive={isListening}
            />

            {/* Analysis Summary */}
            <FuturisticStats
              totalIssues={allIssues.length}
              criticalIssues={allIssues.filter(i => i.severity === 'critical').length}
              duration={currentCall.duration}
              isProcessing={isLoading}
            />

            {/* Recent Issues Preview */}
            {allIssues.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-neon-orange neon-glow">
                    RECENT ALERTS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {allIssues.slice(-3).map((issue, index) => (
                    <div 
                      key={index} 
                      className="p-2 rounded border border-destructive/30 bg-destructive/10 backdrop-blur-sm animate-type-in"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-neon-red neon-glow">
                          {issue.category}
                        </span>
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          issue.severity === 'critical' 
                            ? 'bg-neon-red/20 text-neon-red' 
                            : 'bg-neon-orange/20 text-neon-orange'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {issue.rationale.substring(0, 80)}...
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
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