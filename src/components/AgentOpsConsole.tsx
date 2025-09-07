import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  X, 
  Copy, 
  CheckCircle, 
  Clock,
  Terminal,
  Trash2
} from "lucide-react";
import { demoStore, type ToolCall } from "@/demo/demoStore";
import { useToast } from "@/hooks/use-toast";

interface AgentOpsConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentOpsConsole = ({ isOpen, onClose }: AgentOpsConsoleProps) => {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const { toast } = useToast();

  // Subscribe to tool calls
  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setToolCalls(demoStore.getToolCalls());
    });
    
    // Initial load
    setToolCalls(demoStore.getToolCalls());
    
    return () => {
      unsubscribe();
    };
  }, []);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Tool call data copied successfully"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  }, [toast]);

  const clearLogs = useCallback(() => {
    // Clear tool calls from store - we'll add this method
    demoStore.state.toolCalls = [];
    demoStore.notify();
    toast({
      title: "Logs cleared",
      description: "All tool call logs have been cleared"
    });
  }, [toast]);

  const getToolIcon = (tool: string) => {
    if (tool.includes('rules.match')) return '🔍';
    if (tool.includes('agent.classify')) return '🤖';
    if (tool.includes('notify.escalate')) return '🚨';
    return '⚙️';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'text-green-400' : 'text-red-400';
  };

  const formatDuration = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="floating-panel bottom-4 right-4 w-[600px] h-[500px]"
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Agent Ops Console
                <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  Toolhouse
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearLogs}
                  className="h-8 px-2 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time tool execution logs from compliance agent
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 h-full">
              {/* Timeline */}
              <div className="col-span-2 border-r border-border">
                <div className="p-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Timeline ({toolCalls.length})
                  </h3>
                </div>
                <ScrollArea className="h-[360px]">
                  <div className="px-4 space-y-2">
                    {toolCalls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tool calls yet</p>
                        <p className="text-xs">Start demo to see activity</p>
                      </div>
                    ) : (
                      toolCalls.map((call, index) => (
                        <motion.div
                          key={call.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                          onClick={() => copyToClipboard(JSON.stringify(call, null, 2))}
                        >
                          <div className="text-lg leading-none mt-0.5">
                            {getToolIcon(call.tool)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium truncate">
                                {call.tool}
                              </span>
                              <CheckCircle className={`w-3 h-3 ${getStatusColor(call.status)}`} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(call.duration_ms)}</span>
                              <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* JSON Log */}
              <div className="col-span-3">
                <div className="p-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Latest Call Details
                  </h3>
                </div>
                <ScrollArea className="h-[360px]">
                  <div className="px-4">
                    {toolCalls.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tool execution data</p>
                      </div>
                    ) : (
                      <pre className="text-xs font-mono text-muted-foreground bg-muted/30 p-3 rounded-lg overflow-auto">
                        {JSON.stringify(toolCalls[toolCalls.length - 1], null, 2)}
                      </pre>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>

          <Separator />

          <div className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>🔍 rules.match</span>
                <span>🤖 agent.classify</span>
                <span>🚨 notify.escalate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Live</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};