import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Settings, Eye, RotateCcw } from 'lucide-react';
import { dataAdapter, resetDemoData } from '@/app/dataAdapter';
import { useToast } from '@/hooks/use-toast';

interface DemoBannerProps {
  className?: string;
  showToggle?: boolean;
}

export const DemoBanner = ({ className = '', showToggle = true }: DemoBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleToggleDemoMode = () => {
    dataAdapter.toggleDemoMode(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Alert className={`border-amber-200 bg-amber-50 text-amber-800 ${className}`}>
      <Eye className="h-4 w-4" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            RegCompliance Demo Mode
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              DEMO
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-1">
            You're viewing simulated compliance data for demonstration purposes.
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {showToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleDemoMode}
              className="text-amber-700 border-amber-300 hover:bg-amber-100"
            >
              <Settings className="w-3 h-3 mr-1" />
              Exit Demo
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:bg-amber-100 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

// Demo mode toggle component for settings
export const DemoModeToggle = () => {
  const { toast } = useToast();
  
  const handleToggle = () => {
    dataAdapter.toggleDemoMode();
    toast({
      title: dataAdapter.isDemo ? "Demo Mode Enabled" : "Demo Mode Disabled",
      description: dataAdapter.isDemo ? "Now using simulated data" : "Now using live data",
    });
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast({
      title: "Demo Data Reset",
      description: "Demo data has been reset to initial state.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-medium">Demo Mode</h3>
          <p className="text-sm text-muted-foreground">
            Enable demo mode to view sample compliance data for testing and demonstration.
          </p>
        </div>
        
        <Button
          variant={dataAdapter.isDemo ? "default" : "outline"}
          onClick={handleToggle}
          className={dataAdapter.isDemo ? "bg-amber-600 hover:bg-amber-700" : ""}
        >
          {dataAdapter.isDemo ? 'Disable' : 'Enable'} Demo
        </Button>
      </div>
      
      {dataAdapter.isDemo && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div>
            <h3 className="font-medium">Reset Demo Data</h3>
            <p className="text-sm text-muted-foreground">
              Reset all demo data back to the initial seed state.
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleResetDemo}
            className="ml-4"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Demo Data
          </Button>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;