import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Upload, Phone, PhoneOff, Download, MicOff } from "lucide-react";
import { LiveTranscription } from "./LiveTranscription";
import { RiskAnalysisTable } from "./RiskAnalysisTable";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useToolhouseAgent } from "@/hooks/useToolhouseAgent";
import { useToast } from "@/hooks/use-toast";
import { useSaveCall } from "@/hooks/useSaveCall";

interface CallData {
  id: string;
  duration: number;
  riskScore: number;
  status: 'active' | 'completed';
}

export const ComplianceDashboard = () => {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
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

  // Update risk score when Toolhouse provides new data
  useEffect(() => {
    if (currentCall && currentCall.status === 'active') {
      setCurrentCall(prev => prev ? { ...prev, riskScore } : null);
    }
  }, [riskScore, currentCall]);

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
            
            <Button variant="outline" className="w-full h-12 text-base" size="lg" disabled>
              <Upload className="w-5 h-5 mr-2" />
              Upload Recording
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Upload feature coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentCall.status === 'active') {
    // Live call interface  
    return (
      <div className="space-y-6">
        {/* Call status header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              {isListening ? (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <div className="w-3 h-3 bg-gray-500 rounded-full" />
              )}
              <span>Live Call Monitoring</span>
            </h2>
            <p className="text-muted-foreground">{currentCall.id} • {formatDuration(currentCall.duration)}</p>
          </div>
          
          <Button onClick={endCall} variant="destructive">
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>

        <div className="flex gap-6 h-[calc(100vh-250px)]">
          {/* Main monitoring panel - 80% */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Risk Score</span>
                      <span className="text-2xl font-bold">{Math.round(riskScore)}%</span>
                    </div>
                    <Progress value={riskScore} className="h-3" />
                  </div>
                  
                  {transcript && (
                    <div className="p-2 bg-muted/50 rounded text-sm">
                      <span className="font-medium text-muted-foreground">Current: </span>
                      <span>{transcript}</span>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-mono text-lg">{formatDuration(currentCall.duration)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className={`font-medium flex items-center space-x-1 ${isListening ? 'text-green-600' : 'text-gray-600'}`}>
                          {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                          <span>{isListening ? 'Recording' : 'Paused'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Issues</span>
                      <span className="font-medium">{allIssues.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Critical Issues</span>
                      <span className="font-medium text-red-600">
                        {allIssues.filter(i => i.severity === 'critical').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Processing</span>
                      <span className="font-medium">{isLoading ? 'Analyzing...' : 'Ready'}</span>
                    </div>
                  </div>
                  
                  {allIssues.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Recent Issues</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {allIssues.slice(-3).map((issue, index) => (
                          <div key={index} className="p-2 border rounded text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{issue.category}</span>
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1 text-xs">{issue.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Transcription - 20% */}
          <div className="w-80 min-w-80">
            <LiveTranscription 
              callId={currentCall.id} 
              content={streamingContent}
              isListening={isListening}
            />
          </div>
        </div>
      </div>
    );
  }

  // Post-call analysis
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Call Analysis Complete</h2>
          <p className="text-muted-foreground">
            {currentCall.id} • Duration: {formatDuration(currentCall.duration)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskScore)}`}>
            Risk Score: {Math.round(riskScore)}%
          </span>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setCurrentCall(null)}>
            Start New Call
          </Button>
        </div>
      </div>

      <RiskAnalysisTable callId={currentCall.id} issues={allIssues} />
    </div>
  );
};