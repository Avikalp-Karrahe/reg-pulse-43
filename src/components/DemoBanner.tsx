import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Settings, Eye } from 'lucide-react';
import { toggleDemoMode, DEMO_BANNER_MESSAGE } from '@/lib/demoConfig';

interface DemoBannerProps {
  className?: string;
  showToggle?: boolean;
}

export const DemoBanner = ({ className = '', showToggle = true }: DemoBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleToggleDemoMode = () => {
    toggleDemoMode(false);
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
            {DEMO_BANNER_MESSAGE.title}
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
              DEMO
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-1">
            {DEMO_BANNER_MESSAGE.description}
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
              {DEMO_BANNER_MESSAGE.action}
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
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('regCompliance_demoMode') === 'true';
    }
    return false;
  });

  const handleToggle = () => {
    const newState = toggleDemoMode(!isEnabled);
    setIsEnabled(newState);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-medium">Demo Mode</h3>
        <p className="text-sm text-muted-foreground">
          Enable demo mode to view sample compliance data for testing and demonstration.
        </p>
      </div>
      
      <Button
        variant={isEnabled ? "default" : "outline"}
        onClick={handleToggle}
        className={isEnabled ? "bg-amber-600 hover:bg-amber-700" : ""}
      >
        {isEnabled ? 'Disable' : 'Enable'} Demo
      </Button>
    </div>
  );
};

export default DemoBanner;