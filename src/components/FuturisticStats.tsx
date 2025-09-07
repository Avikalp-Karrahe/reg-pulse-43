import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Activity, Target, Clock } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

interface FuturisticStatsProps {
  totalIssues: number;
  criticalIssues: number;
  duration: number;
  isProcessing: boolean;
}

export const FuturisticStats = ({ 
  totalIssues, 
  criticalIssues, 
  duration,
  isProcessing 
}: FuturisticStatsProps) => {
  const [animatedStats, setAnimatedStats] = useState({
    totalIssues: 0,
    criticalIssues: 0,
    duration: 0
  });

  useEffect(() => {
    const animateValue = (
      start: number, 
      end: number, 
      duration: number, 
      callback: (value: number) => void
    ) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(start + (end - start) * progress);
        callback(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    animateValue(animatedStats.totalIssues, totalIssues, 800, (value) => {
      setAnimatedStats(prev => ({ ...prev, totalIssues: value }));
    });

    animateValue(animatedStats.criticalIssues, criticalIssues, 800, (value) => {
      setAnimatedStats(prev => ({ ...prev, criticalIssues: value }));
    });

    animateValue(animatedStats.duration, duration, 800, (value) => {
      setAnimatedStats(prev => ({ ...prev, duration: value }));
    });
  }, [totalIssues, criticalIssues, duration]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats: StatItem[] = [
    {
      label: "Total Issues",
      value: animatedStats.totalIssues,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-neon-yellow"
    },
    {
      label: "Critical Issues",
      value: animatedStats.criticalIssues,
      icon: <Target className="w-5 h-5" />,
      color: "text-neon-red"
    },
    {
      label: "Duration",
      value: animatedStats.duration,
      icon: <Clock className="w-5 h-5" />,
      color: "text-neon-cyan",
      suffix: "s"
    },
    {
      label: "Processing",
      value: isProcessing ? 1 : 0,
      icon: <Activity className="w-5 h-5" />,
      color: isProcessing ? "text-neon-green" : "text-muted-foreground"
    }
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Activity className="w-5 h-5 text-neon-cyan neon-glow" />
          <span>Analysis Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="space-y-2 p-3 rounded-lg bg-black/20 border border-primary/10 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`${stat.color} neon-glow`}>
                  {stat.icon}
                </div>
                <div className={`text-right ${stat.color === "text-muted-foreground" ? "text-muted-foreground" : stat.color + " neon-glow"}`}>
                  <div className="text-xl font-bold font-mono animate-count-up">
                    {stat.label === "Duration" 
                      ? formatDuration(stat.value)
                      : stat.label === "Processing"
                      ? (stat.value ? "ACTIVE" : "IDLE")
                      : stat.value
                    }
                    {stat.suffix && stat.label !== "Duration" && stat.label !== "Processing" && stat.suffix}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {stat.label.toUpperCase()}
              </div>
              
              {/* Progress bar for visual effect */}
              <div className="w-full h-1 bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    stat.color.replace('text-', 'bg-')
                  } transition-all duration-1000 ease-out neon-glow`}
                  style={{
                    width: stat.label === "Processing" 
                      ? (stat.value ? "100%" : "0%")
                      : stat.label === "Duration"
                      ? "100%"
                      : `${Math.min((stat.value / 10) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};