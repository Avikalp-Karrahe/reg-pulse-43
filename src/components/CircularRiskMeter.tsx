import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert } from "lucide-react";

interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

interface CircularRiskMeterProps {
  riskScore?: number;
  isActive: boolean;
  issues?: ComplianceIssue[];
  streamingMode?: boolean;
}

export const CircularRiskMeter = ({ 
  riskScore = 0, 
  isActive, 
  issues = [], 
  streamingMode = false 
}: CircularRiskMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [calculatedScore, setCalculatedScore] = useState(0);
  
  // Calculate risk score from issues in streaming mode
  const calculateRiskFromIssues = (issueList: ComplianceIssue[]): number => {
    if (issueList.length === 0) return 0;
    
    const severityWeights = {
      critical: 3,
      high: 2, 
      medium: 1,
      low: 0.5
    };
    
    const totalWeight = issueList.reduce((sum, issue) => {
      return sum + (severityWeights[issue.severity] || 1);
    }, 0);
    
    // Normalize to 0-100 scale with progressive scaling
    const maxWeight = issueList.length * severityWeights.critical;
    const baseScore = (totalWeight / maxWeight) * 100;
    
    // Apply progressive scaling for multiple issues
    const issueMultiplier = Math.min(1.5, 1 + (issueList.length - 1) * 0.1);
    const finalScore = Math.min(100, baseScore * issueMultiplier);
    
    return Math.round(finalScore);
  };
  
  // Update calculated score when issues change in streaming mode
  useEffect(() => {
    if (streamingMode) {
      const newScore = calculateRiskFromIssues(issues);
      setCalculatedScore(newScore);
    }
  }, [issues, streamingMode]);
  
  // Use either provided riskScore or calculated score
  const targetScore = streamingMode ? calculatedScore : riskScore;

  useEffect(() => {
    const duration = streamingMode ? 500 : 1000; // Faster animation in streaming mode
    const steps = 30;
    const startScore = animatedScore;
    const scoreDiff = targetScore - startScore;
    const increment = scoreDiff / steps;
    const stepTime = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newScore = startScore + (increment * currentStep);
      const clampedScore = Math.max(0, Math.min(100, newScore));
      setAnimatedScore(clampedScore);
      setDisplayScore(Math.round(clampedScore));

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedScore(targetScore);
        setDisplayScore(targetScore);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [targetScore, streamingMode]);

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
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 ${
      isCritical ? 'animate-pulse-glow' : ''
    }`}
    role="progressbar"
    aria-valuenow={displayScore}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={`Risk assessment: ${displayScore}% - ${risk.level} level`}
    >
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