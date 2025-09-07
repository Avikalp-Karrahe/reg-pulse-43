import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Settings, AlertTriangle, CheckCircle, ExternalLink, Info, MessageSquare } from "lucide-react";
import { audioManager, AudioDevice, getPermissionErrorMessage, openChromeMicSettings } from "@/lib/audio";
import { useToast } from "@/hooks/use-toast";
import { DemoModeToggle } from "@/components/DemoBanner";
import { Switch } from "@/components/ui/switch";
import { demoStore } from "@/demo/demoStore";


export const AudioInputSetup = () => {
  
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ rms: 0, peak: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slackEscalationEnabled, setSlackEscalationEnabled] = useState(demoStore.getSettings().enableSlackEscalation);
  const intervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialState();
    
    // Listen for Slack escalation events
    const handleSlackEscalation = (event: CustomEvent) => {
      const { category, severity } = event.detail;
      toast({
        title: `Escalated to Slack: ${category}`,
        description: `${severity.toUpperCase()} severity issue reported to #risk-alerts`,
        variant: severity === 'critical' ? 'destructive' : 'default',
      });
    };
    
    window.addEventListener('slackEscalation', handleSlackEscalation as EventListener);
    
    return () => {
      stopAudioStream();
      window.removeEventListener('slackEscalation', handleSlackEscalation as EventListener);
    };
  }, []);

  const loadInitialState = async () => {
    try {
      const permission = await audioManager.getPermissionState();
      setPermissionState(permission);
      
      const savedDeviceId = audioManager.getSelectedDeviceId();
      setSelectedDeviceId(savedDeviceId);
      
      await loadDevices();
    } catch (error) {
      console.error('Error loading initial state:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const deviceList = await audioManager.getAudioDevices();
      setDevices(deviceList);
      
      if (deviceList.length === 0 && permissionState === 'granted') {
        setError('No audio input devices found. Please connect a microphone.');
      }
    } catch (error) {
      setError('Failed to load audio devices. Please refresh and try again.');
    }
  };

  const requestMicAccess = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await audioManager.requestMicrophoneAccess(selectedDeviceId || undefined);
      audioManager.setupAudioAnalyser(stream);
      
      setPermissionState('granted');
      setIsStreamActive(true);
      
      // Start audio level monitoring
      startAudioLevelMonitoring();
      
      // Reload devices to get labels
      await loadDevices();
      
      toast({
        title: "Microphone Access Granted",
        description: "Audio input is now active. You can see the audio levels below.",
      });
    } catch (error) {
      const errorMessage = error instanceof DOMException 
        ? getPermissionErrorMessage(error)
        : 'Failed to access microphone. Please try again.';
      
      setError(errorMessage);
      setPermissionState('denied');
      
      toast({
        title: "Microphone Access Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = window.setInterval(() => {
      const levels = audioManager.getAudioLevels();
      setAudioLevels(levels);
    }, 100);
  };

  const stopAudioStream = () => {
    audioManager.stopCurrentStream();
    setIsStreamActive(false);
    setAudioLevels({ rms: 0, peak: 0 });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    audioManager.setSelectedDeviceId(deviceId);
    
    // If stream is active, restart with new device
    if (isStreamActive) {
      stopAudioStream();
      setTimeout(requestMicAccess, 100);
    }
  };

  const getPermissionBadgeColor = (state: PermissionState) => {
    switch (state) {
      case 'granted': return 'bg-green-100 text-green-800 border-green-200';
      case 'denied': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getPermissionIcon = (state: PermissionState) => {
    switch (state) {
      case 'granted': return <CheckCircle className="w-4 h-4" />;
      case 'denied': return <MicOff className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId);
  const isWebSpeechSupported = audioManager.isWebSpeechSupported();

  const handleSlackToggle = (enabled: boolean) => {
    setSlackEscalationEnabled(enabled);
    demoStore.updateSettings({ enableSlackEscalation: enabled });
    toast({
      title: enabled ? "Slack Escalation Enabled" : "Slack Escalation Disabled",
      description: enabled 
        ? "HIGH severity issues will now be escalated to Slack" 
        : "Issues will no longer be escalated to Slack",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audio Input Setup</h1>
        <p className="text-muted-foreground">Configure your microphone and virtual audio cable for compliance monitoring</p>
      </div>

      {/* Web Speech API Info */}
      {isWebSpeechSupported && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <strong>Chrome Users:</strong> Web Speech API uses the site-selected microphone. 
            Ensure Chrome's microphone setting for this site is set to your virtual audio device.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-sm"
              onClick={openChromeMicSettings}
            >
              Open Chrome Settings <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Microphone Permission</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Status</span>
            <Badge className={getPermissionBadgeColor(permissionState)}>
              {getPermissionIcon(permissionState)}
              <span className="ml-1 capitalize">{permissionState}</span>
            </Badge>
          </div>
          
          {permissionState !== 'granted' && (
            <Button 
              onClick={requestMicAccess}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Requesting Access...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Request Microphone Access
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Device Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Device Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 && permissionState === 'granted' ? (
            <p className="text-sm text-muted-foreground">
              No audio input devices found. Please connect a microphone and refresh the page.
            </p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Grant microphone permission first to see available devices.
            </p>
          ) : (
            <>
              <Select 
                value={selectedDeviceId && selectedDeviceId.trim() !== '' ? selectedDeviceId : undefined} 
                onValueChange={handleDeviceSelect}
              >
                <SelectTrigger className="bg-background border border-input">
                  <SelectValue placeholder="Select an audio input device" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {devices
                    .filter(device => device.deviceId && device.deviceId.trim() !== '')
                    .map((device) => (
                      <SelectItem 
                        key={device.deviceId} 
                        value={device.deviceId}
                        className="bg-background hover:bg-accent focus:bg-accent"
                      >
                        {device.label}
                      </SelectItem>
                    ))}
                  {devices.filter(device => device.deviceId && device.deviceId.trim() !== '').length === 0 && (
                    <SelectItem value="no-devices" disabled>
                      No audio devices available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {selectedDevice && (
                <div className="text-sm text-muted-foreground">
                  Selected: <strong>{selectedDevice.label}</strong>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Audio Level Monitor */}
      {permissionState === 'granted' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Audio Level Monitor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Stream Status</span>
              <Badge variant={isStreamActive ? "default" : "outline"}>
                {isStreamActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            {!isStreamActive && selectedDeviceId && (
              <Button 
                onClick={requestMicAccess}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? "Starting..." : "Start Audio Test"}
              </Button>
            )}
            
            {isStreamActive && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>RMS Level</span>
                    <span>{Math.round(audioLevels.rms * 100)}%</span>
                  </div>
                  <Progress value={audioLevels.rms * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Peak Level</span>
                    <span>{Math.round(audioLevels.peak * 100)}%</span>
                  </div>
                  <Progress value={audioLevels.peak * 100} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Play audio to test your virtual cable connection
                  </span>
                  <Button 
                    onClick={stopAudioStream}
                    variant="outline"
                    size="sm"
                  >
                    Stop Test
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Demo Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Mode Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DemoModeToggle />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <div>
                <label htmlFor="slack-escalation" className="text-sm font-medium">
                  Simulate Slack Escalation
                </label>
                <p className="text-xs text-muted-foreground">
                  Show toast notifications and log escalations for HIGH severity issues
                </p>
              </div>
            </div>
            <Switch
              id="slack-escalation"
              checked={slackEscalationEnabled}
              onCheckedChange={handleSlackToggle}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Virtual Cable Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Audio Cable Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <strong>macOS:</strong> Install BlackHole 2ch and select "BlackHole 2ch" in the device list above.
          </div>
          <div>
            <strong>Windows:</strong> Install VB-Audio Cable and select "CABLE Output (VB-Audio)" in the device list above.
          </div>
          <div>
            <strong>Testing:</strong> Play audio on your system while monitoring the levels above to verify the virtual cable is working.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};