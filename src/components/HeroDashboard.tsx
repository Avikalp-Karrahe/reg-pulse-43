import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Users, 
  PlayCircle,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

const metrics = [
  { label: "Active Calls", value: "12", change: "+2", trend: "up", icon: Activity },
  { label: "Risk Score", value: "67", change: "-5", trend: "down", icon: Shield },
  { label: "Violations", value: "3", change: "+1", trend: "up", icon: AlertTriangle },
  { label: "Agents", value: "24", change: "+3", trend: "up", icon: Users },
];

const recentAlerts = [
  {
    id: 1,
    type: "Performance Guarantee",
    severity: "high",
    agent: "Sarah Chen",
    time: "2 min ago",
    evidence: "guaranteed 20% returns monthly"
  },
  {
    id: 2,
    type: "Unauthorized Advice",
    severity: "medium",
    agent: "Mike Rodriguez",
    time: "8 min ago",
    evidence: "you should definitely invest in this"
  },
  {
    id: 3,
    type: "Information Disclosure",
    severity: "low",
    agent: "Emma Wilson",
    time: "15 min ago",
    evidence: "other clients have seen great results"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const HeroDashboard = () => {
  const [realTimeData, setRealTimeData] = useState({
    riskScore: 67,
    activeViolations: 3,
    callsMonitored: 12,
    complianceRate: 94
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        riskScore: Math.max(45, Math.min(85, prev.riskScore + (Math.random() - 0.5) * 4)),
        activeViolations: Math.max(0, Math.min(8, prev.activeViolations + Math.floor((Math.random() - 0.7) * 2))),
        callsMonitored: Math.max(8, Math.min(25, prev.callsMonitored + Math.floor((Math.random() - 0.5) * 2))),
        complianceRate: Math.max(85, Math.min(98, prev.complianceRate + (Math.random() - 0.5) * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-400";
    if (score >= 65) return "text-orange-400";
    if (score >= 45) return "text-amber-400";
    return "text-emerald-400";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "low": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <motion.div
      className="min-h-screen p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Compliance Command Center</h1>
            <p className="text-lg text-muted-foreground">Real-time monitoring and risk analysis</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="border-emerald-500/30">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics
            </Button>
            <Button className="button-premium" size="lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Real-time Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isRiskScore = metric.label === "Risk Score";
          const currentValue = isRiskScore ? Math.round(realTimeData.riskScore) : metric.value;
          
          return (
            <Card key={metric.label} className="card-glass p-6 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`w-8 h-8 ${isRiskScore ? getRiskColor(realTimeData.riskScore) : 'text-emerald-400'}`} />
                <Badge variant="outline" className={`${metric.trend === 'up' ? 'text-red-400' : 'text-emerald-400'} border-current`}>
                  {metric.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold">{currentValue}</h3>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Live Risk Monitor */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="card-premium p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Live Risk Monitor</h2>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Score Visualization */}
              <div className="text-center">
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="hsl(var(--border))" 
                      strokeWidth="8" 
                      fill="none" 
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={realTimeData.riskScore >= 80 ? "hsl(var(--neon-red))" : 
                             realTimeData.riskScore >= 65 ? "hsl(var(--neon-orange))" : 
                             "hsl(var(--neon-amber))"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      animate={{ 
                        strokeDashoffset: 251.2 - (realTimeData.riskScore / 100) * 251.2
                      }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="drop-shadow-lg"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div 
                        className={`text-4xl font-bold ${getRiskColor(realTimeData.riskScore)}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {Math.round(realTimeData.riskScore)}
                      </motion.div>
                      <div className="text-sm text-muted-foreground">Risk Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Statistics */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-card/50">
                    <div className="text-2xl font-bold text-emerald-400">{realTimeData.callsMonitored}</div>
                    <div className="text-xs text-muted-foreground">Active Calls</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card/50">
                    <div className="text-2xl font-bold text-amber-400">{realTimeData.activeViolations}</div>
                    <div className="text-xs text-muted-foreground">Violations</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Compliance Rate</span>
                    <span className="text-emerald-400">{realTimeData.complianceRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                      animate={{ width: `${realTimeData.complianceRate}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="card-glass p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Recent Alerts</h3>
              <Badge variant="outline" className="text-red-400 border-red-400/30">
                {recentAlerts.length} Active
              </Badge>
            </div>

            <div className="space-y-4">
              {recentAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg bg-card/30 border border-border/30 hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      {alert.time}
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{alert.type}</h4>
                  <p className="text-xs text-muted-foreground mb-2">Agent: {alert.agent}</p>
                  
                  <div className="text-xs p-2 rounded bg-red-500/5 border border-red-500/10">
                    <span className="text-red-400 font-mono">"{alert.evidence}"</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10">
              View All Alerts
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="card-glass p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col border-emerald-500/30">
              <CheckCircle className="w-5 h-5 mb-1" />
              Approve Call
            </Button>
            <Button variant="outline" className="h-16 flex-col border-red-500/30">
              <XCircle className="w-5 h-5 mb-1" />
              Flag Violation
            </Button>
            <Button variant="outline" className="h-16 flex-col border-amber-500/30">
              <AlertTriangle className="w-5 h-5 mb-1" />
              Review Queue
            </Button>
            <Button variant="outline" className="h-16 flex-col border-cyan-500/30">
              <BarChart3 className="w-5 h-5 mb-1" />
              Generate Report
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};