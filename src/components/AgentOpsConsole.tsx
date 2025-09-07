import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Copy, Trash2, Activity, Brain, Bell, Search, Code } from 'lucide-react';
import { toast } from 'sonner';
import { demoStore, type ToolCall } from '@/demo/demoStore';

interface AgentOpsConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentOpsConsole({ isOpen, onClose }: AgentOpsConsoleProps) {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  // Subscribe to demo store updates
  useEffect(() => {
    const updateToolCalls = () => {
      setToolCalls(demoStore.getToolCalls());
    };

    updateToolCalls();
    const unsubscribe = demoStore.subscribe(updateToolCalls);
    return unsubscribe;
  }, []);

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const clearLogs = () => {
    demoStore.clearToolCalls();
    toast.success('Tool logs cleared');
  };

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'rules.match':
        return '🎯';
      case 'agent.classify':
        return '🧠';
      case 'notify.escalate':
        return '🚨';
      default:
        return '⚡';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
  };

  const latestCall = toolCalls[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-[600px] z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-l"
      >
        <Card className="h-full rounded-none border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Agent Ops Console
                <Badge variant="secondary" className="text-xs">
                  Toolhouse
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time tool execution monitoring and logging
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="h-[calc(100vh-8rem)] p-6">
            <div className="grid grid-cols-5 gap-4 h-full">
              {/* Left: Tool Call Timeline */}
              <div className="col-span-2 flex flex-col">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Timeline ({toolCalls.length})
                </h3>
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {toolCalls.map((call) => (
                      <motion.div
                        key={call.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => copyToClipboard(JSON.stringify(call, null, 2))}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getToolIcon(call.tool)}</span>
                            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                              {call.tool}
                            </code>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(call.status)}`}
                          >
                            {call.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDuration(call.latency_ms)}</span>
                          <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    ))}

                    {toolCalls.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tool calls yet</p>
                        <p className="text-xs">Start monitoring to see logs</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: Latest Call Details */}
              <div className="col-span-3 flex flex-col">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Latest Call Details
                </h3>
                <ScrollArea className="flex-1">
                  {latestCall ? (
                    <div className="space-y-4">
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                        {JSON.stringify(latestCall, null, 2)}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(latestCall, null, 2))}
                        className="w-full gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No call selected</p>
                      <p className="text-xs">Click on a timeline item to view details</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>

          {/* Footer: Legend */}
          <div className="px-6 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>🎯 Rules Match</span>
                <span>🧠 AI Classify</span>
                <span>🚨 Escalation</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-green-500">● Success</span>
                <span className="text-red-500">● Error</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}