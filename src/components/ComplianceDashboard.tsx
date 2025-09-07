import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Upload, Phone, PhoneOff, Download } from "lucide-react";
import { LiveTranscription } from "./LiveTranscription";
import { RiskAnalysisTable } from "./RiskAnalysisTable";

interface CallData {
  id: string;
  duration: number;
  riskScore: number;
  status: 'active' | 'completed';
}

export const ComplianceDashboard = () => {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);

  const startRecording = () => {
    const newCall: CallData = {
      id: `CALL-${Date.now()}`,
      duration: 0,
      riskScore: 0,
      status: 'active'
    };
    setCurrentCall(newCall);

    // Start duration counter
    const interval = setInterval(() => {
      setCurrentCall(prev => prev ? {
        ...prev,
        duration: prev.duration + 1,
        riskScore: Math.min(prev.riskScore + Math.random() * 2, 85) // Simulate increasing risk
      } : null);
    }, 1000);

    // Store interval for cleanup
    (newCall as any).interval = interval;
  };

  const endCall = () => {
    if (currentCall) {
      if ((currentCall as any).interval) {
        clearInterval((currentCall as any).interval);
      }
      setCurrentCall({
        ...currentCall,
        status: 'completed'
      });
    }
  };

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
              Record and analyze calls for regulatory compliance
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={startRecording}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Call Recording
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full h-12 text-base" size="lg">
              <Upload className="w-5 h-5 mr-2" />
              Upload Recording
            </Button>
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
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
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
                      <span className="text-2xl font-bold">{Math.round(currentCall.riskScore)}%</span>
                    </div>
                    <Progress value={currentCall.riskScore} className="h-3" />
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Duration</div>
                        <div className="font-mono text-lg">{formatDuration(currentCall.duration)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="text-green-600 font-medium">Recording</div>
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
                      <span className="text-sm">Compliance Issues</span>
                      <span className="font-medium">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Risk Statements</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Statements</span>
                      <span className="font-medium">{Math.floor(currentCall.duration / 5)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Live Transcription - 20% */}
          <div className="w-80 min-w-80">
            <LiveTranscription callId={currentCall.id} />
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
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(currentCall.riskScore)}`}>
            Risk Score: {Math.round(currentCall.riskScore)}%
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

      <RiskAnalysisTable callId={currentCall.id} />
    </div>
  );
};