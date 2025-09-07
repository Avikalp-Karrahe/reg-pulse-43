import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert } from "lucide-react";

interface CircularRiskMeterProps {
  riskScore: number;
  isActive: boolean;
}

export const CircularRiskMeter = ({ riskScore, isActive }: CircularRiskMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 50;
    const increment = riskScore / steps;
    const stepTime = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newScore = Math.min(increment * currentStep, riskScore);
      setAnimatedScore(newScore);
      setDisplayScore(Math.round(newScore));

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [riskScore]);

  const circumference = 2 * Math.PI * 40; // radius of 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getRiskLevel = (score: number) => {
    if (score <= 20) return { level: "SAFE", color: "text-neon-green", glowColor: "neon-green" };
    if (score <= 40) return { level: "LOW", color: "text-neon-yellow", glowColor: "neon-yellow" };
    if (score <= 60) return { level: "MEDIUM", color: "text-neon-orange", glowColor: "neon-orange" };
    if (score <= 80) return { level: "HIGH", color: "text-neon-red", glowColor: "neon-red" };
    return { level: "CRITICAL", color: "text-neon-red", glowColor: "neon-red" };
  };

  const getRingColor = (score: number) => {
    if (score <= 20) return "#00ff00"; // neon green
    if (score <= 40) return "#ffff00"; // neon yellow
    if (score <= 60) return "#ff8800"; // neon orange
    if (score <= 80) return "#ff4400"; // neon red
    return "#ff0000"; // deep red
  };

  const risk = getRiskLevel(displayScore);
  const ringColor = getRingColor(animatedScore);
  const isCritical = displayScore > 80;

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10 ${
      isCritical ? 'animate-pulse-glow' : ''
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {isCritical ? (
            <ShieldAlert className="w-5 h-5 text-neon-red neon-glow" />
          ) : (
            <Shield className="w-5 h-5 text-neon-cyan neon-glow" />
          )}
          <span>Risk Assessment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {/* Circular Progress Ring */}
        <div className="relative w-32 h-32">
          <svg 
            className="w-32 h-32 transform -rotate-90" 
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
              opacity="0.3"
            />
            
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={ringColor}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                isCritical ? 'animate-pulse-glow' : 'neon-glow'
              }`}
              style={{ 
                filter: `drop-shadow(0 0 8px ${ringColor}) drop-shadow(0 0 16px ${ringColor})`,
                strokeDasharray,
                strokeDashoffset
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold font-mono ${risk.color} ${
              isCritical ? 'animate-pulse-glow' : 'neon-glow'
            } animate-count-up`}>
              {displayScore}%
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              RISK LEVEL
            </div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className={`px-4 py-2 rounded-lg border bg-black/20 backdrop-blur-sm ${
          isCritical ? 'border-neon-red animate-pulse-glow' : `border-${risk.glowColor}`
        }`}>
          <span className={`text-sm font-bold tracking-wider ${risk.color} ${
            isCritical ? 'animate-pulse-glow' : 'neon-glow'
          }`}>
            {risk.level}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-neon-green animate-pulse' : 'bg-muted'
          }`} />
          <span className="text-muted-foreground font-mono">
            {isActive ? 'ANALYZING' : 'STANDBY'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};