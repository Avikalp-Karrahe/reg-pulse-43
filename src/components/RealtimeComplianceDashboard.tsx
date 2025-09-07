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
    isAgentSpeaking,
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

  const handleToggleAssistant = async () => {
    try {
      if (!isConnected && !isRecording) {
        // Start everything
        await connect();
        await startRecording();
        setCallActive(true);
        setCallDuration(0);
        resetSession();
      } else {
        // Stop everything
        stopRecording();
        disconnect();
        setCallActive(false);
        setCallDuration(0);
      }
    } catch (error) {
      console.error('Error toggling assistant:', error);
      toast({
        title: "Error",
        description: "Failed to toggle assistant. Please check microphone permissions.",
        variant: "destructive",
      });
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
              LIVE COMPLIANCE ASSISTANT
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered live voice monitoring for regulatory compliance
            </p>
          </div>

          <Card className="w-full max-w-md mx-auto bg-card/50 backdrop-blur-sm border-cyan-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-cyan-400">Start Live Assistant</CardTitle>
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
                onClick={handleToggleAssistant}
                className={`w-full h-12 text-base text-white ${
                  isConnected || isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
                size="lg"
              >
                {isConnected || isRecording ? (
                  <>
                    <PhoneOff className="w-5 h-5 mr-2" />
                    End Assistant
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-2" />
                    Start Live Assistant
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This will connect to OpenAI's real-time voice API for interactive compliance assistance
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
              <span>LIVE COMPLIANCE ASSISTANT</span>
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
                      <Mic className="w-5 h-5 text-green-500 animate-pulse" />
                    ) : (
                      <MicOff className="w-5 h-5 text-muted-foreground" />
                    )}
                    Live Conversation
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col">
                  <ScrollArea className="flex-1 mb-4">
                    <div className="space-y-3 pr-4">
                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          Start speaking to begin the conversation...
                        </div>
                      )}
                      {messages.map((message, index) => {
                        console.log('🔍 Rendering message:', message);
                        return (
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
                        );
                      })}
                    
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

                     {/* Agent speaking indicator */}
                     {isAgentSpeaking && (
                       <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mr-8 animate-pulse">
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                           <span className="text-xs font-medium text-green-400">AI Assistant</span>
                           <span className="text-xs text-muted-foreground">speaking aloud...</span>
                         </div>
                         <p className="text-sm text-green-300 italic">🔊 Voice output active</p>
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

          {/* Right column - Risk Analysis Table */}
          <div className="space-y-6">
            {/* Risk Analysis Table with Checkboxes */}
            <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg text-red-400">Risk Analysis Table</CardTitle>
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
                      const matchingIssues = complianceIssues.filter(issue => {
                        const issueCategory = issue.category.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const categoryKey = category.id.split('_')[0];
                        return issueCategory.includes(categoryKey) || 
                               issueCategory.includes(category.id) ||
                               issue.category.toLowerCase().includes(category.name.toLowerCase().split(' ')[0]);
                      });
                      
                      const hasViolation = matchingIssues.length > 0;
                      const highestSeverity = hasViolation ? 
                        matchingIssues.reduce((max, issue) => {
                          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
                          return severityOrder[issue.severity] > severityOrder[max.severity] ? issue : max;
                        }).severity : null;
                      
                      return (
                        <div
                          key={category.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-500 ${
                            hasViolation 
                              ? 'bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20 animate-pulse' 
                              : 'bg-muted/20 border-muted-foreground/20 hover:border-muted-foreground/40'
                          }`}
                        >
                          {/* Checkbox indicator */}
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                            hasViolation 
                              ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/30' 
                              : 'border-muted-foreground/40 bg-transparent hover:border-muted-foreground/60'
                          }`}>
                            {hasViolation ? (
                              // Red X for violations
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            ) : (
                              // Empty checkbox
                              <div className="w-3 h-3 border border-muted-foreground/30 rounded-sm" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium text-sm transition-colors ${
                                hasViolation ? 'text-red-400' : 'text-muted-foreground'
                              }`}>
                                {category.name}
                              </span>
                              
                              {hasViolation ? (
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs border-red-500/50 text-red-400 bg-red-500/10 ${
                                      highestSeverity === 'critical' ? 'animate-pulse' : ''
                                    }`}
                                  >
                                    {highestSeverity?.toUpperCase()}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-6 px-2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                                  >
                                    CLEAR
                                  </Button>
                                </div>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs border-muted-foreground/30 text-muted-foreground bg-transparent"
                                >
                                  MONITORING
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {category.regulation}
                            </p>
                            
                            {/* Show violation details when detected */}
                            {hasViolation && (
                              <div className="mt-2 space-y-1 animate-fade-in">
                                {matchingIssues.slice(0, 2).map((issue, idx) => (
                                  <div key={idx} className="p-2 bg-red-500/10 rounded border border-red-500/20">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-red-300 font-medium">
                                        {issue.severity.toUpperCase()} VIOLATION
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Just now
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {issue.rationale}
                                    </p>
                                    {issue.evidenceSnippet && (
                                      <p className="text-xs text-red-200 mt-1 italic">
                                        "{issue.evidenceSnippet}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                                {matchingIssues.length > 2 && (
                                  <p className="text-xs text-red-400 font-medium">
                                    +{matchingIssues.length - 2} more violation{matchingIssues.length - 2 > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            )}
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
                          {complianceIssues.length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Issues
                        </div>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">
                          {complianceIssues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
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
          </div>
        </div>
      </div>
    </div>
  );
};