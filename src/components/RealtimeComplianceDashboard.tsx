import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Phone, PhoneOff, Send, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRealtimeCompliance } from "@/hooks/useRealtimeCompliance";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CircularRiskMeter } from "./CircularRiskMeter";
import { FuturisticStats } from "./FuturisticStats";
import { useToast } from "@/hooks/use-toast";

export const RealtimeComplianceDashboard = () => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callActive, setCallActive] = useState(false);

  const {
    isConnected,
    isRecording,
    messages,
    complianceIssues,
    guidance,
    currentTranscript,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    resetSession,
  } = useRealtimeCompliance();

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const handleStartCall = async () => {
    try {
      if (!isConnected) {
        await connect();
      }
      await startRecording();
      setCallActive(true);
      setCallDuration(0);
      resetSession();
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error Starting Call",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = () => {
    stopRecording();
    setCallActive(false);
    setCallDuration(0);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateRiskScore = () => {
    if (complianceIssues.length === 0) return 0;
    
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalWeight = complianceIssues.reduce(
      (sum, issue) => sum + severityWeights[issue.severity],
      0
    );
    
    return Math.min(100, (totalWeight / complianceIssues.length) * 25);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted';
    }
  };

  // If no call is active, show start screen
  if (!callActive) {
    return (
      <div className="min-h-screen bg-background particles-bg p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 neon-glow mb-2">
              Real-Time Compliance Monitor
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered live voice monitoring for regulatory compliance
            </p>
          </div>

          <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-cyan-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-cyan-400">Start Live Monitoring</CardTitle>
              <p className="text-muted-foreground text-sm">
                Connect to real-time AI compliance assistant for live call monitoring
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Connected to AI Service</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ready to Connect</span>
                  </>
                )}
              </div>
              
              <Button 
                onClick={handleStartCall}
                className="w-full h-12 text-base bg-cyan-600 hover:bg-cyan-700 text-white"
                size="lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Start Live Monitoring
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This will connect to OpenAI's real-time voice API for interactive compliance monitoring
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active call interface
  return (
    <div className="min-h-screen bg-background particles-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Call header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
          <div>
            <h2 className="text-xl font-bold text-cyan-400 neon-glow flex items-center gap-2">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              <span>LIVE COMPLIANCE MONITORING</span>
            </h2>
            <p className="text-muted-foreground font-mono">
              Real-time Analysis • {formatDuration(callDuration)}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 text-sm">AI Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 text-sm">AI Disconnected</span>
                </>
              )}
            </div>
            
            <Button 
              onClick={handleEndCall} 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 border-red-500"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Monitoring
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Real-time conversation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live conversation */}
            <Card className="h-[500px] bg-card/50 backdrop-blur-sm border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-cyan-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <Mic className="w-5 h-5 text-green-500" />
                    ) : (
                      <MicOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    Live Conversation
                  </div>
                  <Button
                    onClick={handleToggleRecording}
                    size="sm"
                    variant={isRecording ? "destructive" : "default"}
                    className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-1" />
                        Stop Mic
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-1" />
                        Start Mic
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3 pr-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-cyan-500/20 border border-cyan-500/30 ml-8'
                            : 'bg-muted/50 border border-border mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.role === 'user' ? 'text-cyan-400' : 'text-primary'
                          }`}>
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{message.content}</p>
                      </div>
                    ))}
                    
                    {/* Current transcript */}
                    {currentTranscript && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mr-8 animate-fade-in">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">AI Assistant</span>
                          <span className="text-xs text-muted-foreground">speaking...</span>
                        </div>
                        <p className="text-sm text-foreground italic">{currentTranscript}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Text input */}
                <div className="flex gap-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type a message to the AI..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendText} size="sm">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guidance alerts */}
            {guidance.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-400">Real-time Guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[150px]">
                    <div className="space-y-2">
                      {guidance.slice(-3).map((guide, index) => (
                        <Alert key={index} className="border-amber-500/30 bg-amber-500/10">
                          <AlertTitle className="text-amber-400 text-sm">
                            {guide.warning_type.charAt(0).toUpperCase() + guide.warning_type.slice(1)} Guidance
                          </AlertTitle>
                          <AlertDescription className="text-sm">
                            {guide.guidance}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Monitoring panels */}
          <div className="space-y-6">
            {/* Risk meter */}
            <CircularRiskMeter 
              riskScore={calculateRiskScore()} 
              isActive={isRecording}
              issues={complianceIssues}
            />

            {/* Stats */}
            <FuturisticStats
              totalIssues={complianceIssues.length}
              criticalIssues={complianceIssues.filter(i => i.severity === 'critical').length}
              duration={callDuration}
              isProcessing={isRecording}
            />

            {/* Recent compliance issues */}
            <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-red-400">Compliance Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {complianceIssues.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No compliance issues detected
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {complianceIssues.map((issue, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border bg-card/30 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {issue.category}
                            </span>
                            <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {issue.rationale}
                          </p>
                          
                          {issue.evidenceSnippet && (
                            <div className="p-2 bg-muted/30 rounded text-xs">
                              <span className="text-muted-foreground">Evidence: </span>
                              <span className="text-foreground italic">"{issue.evidenceSnippet}"</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{issue.reg_reference}</span>
                            <span>{new Date(issue.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};