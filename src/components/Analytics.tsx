import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, AlertTriangle, Clock, TrendingUp, Loader2, Info, BookOpen, Shield, AlertOctagon } from "lucide-react";
import { useCalls } from "@/hooks/useCalls";
import { useAllIssues } from "@/hooks/useIssues";
import { useMemo, useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}

const AnimatedCounter = ({ value, duration = 1500, decimals = 0, suffix = "" }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;

      if (progress < 1) {
        setCount(value * progress);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
};

// Severity Badge Component
interface SeverityBadgeProps {
  severity: string;
  count: number;
  regReference?: string;
  evidenceSnippet?: string;
}

const SeverityBadge = ({ severity, count, regReference, evidenceSnippet }: SeverityBadgeProps) => {
  const getBadgeStyle = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/40 animate-pulse border-red-400';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40 animate-pulse border-amber-400 glow-amber';
      case 'low':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 border-blue-400 glow-blue';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <div className="group relative">
      <Badge className={`${getBadgeStyle(severity)} cursor-help transition-all duration-300 hover:scale-105`}>
        {severity.toUpperCase()}: {count}
      </Badge>
      {(regReference || evidenceSnippet) && (
        <div className="invisible group-hover:visible absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-lg p-3 shadow-lg min-w-[250px] max-w-[350px]">
          <div className="space-y-2">
            {regReference && (
              <div>
                <p className="text-xs font-semibold text-primary">Regulation:</p>
                <p className="text-xs font-mono">{regReference}</p>
              </div>
            )}
            {evidenceSnippet && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Sample Evidence:</p>
                <p className="text-xs italic text-muted-foreground">{evidenceSnippet}</p>
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-border"></div>
        </div>
      )}
    </div>
  );
};

export const Analytics = () => {
  const { data: calls, isLoading: callsLoading } = useCalls();
  const { data: issues, isLoading: issuesLoading } = useAllIssues();

  // Refs for scroll animations
  const { ref: riskTrendRef, inView: riskTrendInView } = useInView({ threshold: 0.3, triggerOnce: true });
  const { ref: categoryRef, inView: categoryInView } = useInView({ threshold: 0.3, triggerOnce: true });
  const { ref: severityRef, inView: severityInView } = useInView({ threshold: 0.3, triggerOnce: true });

  // Enhanced analytics data with daily risk trends
  const analyticsData = useMemo(() => {
    if (!calls || !issues) return null;

    // Calculate daily risk score trends (last 7 days)
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    });

    const dailyRiskData = last7Days.map(date => {
      const dayStart = new Date(date + 'T00:00:00');
      const dayEnd = new Date(date + 'T23:59:59');
      
      const dayCalls = calls.filter(call => {
        const callDate = new Date(call.date);
        return callDate >= dayStart && callDate <= dayEnd;
      });

      const avgRiskScore = dayCalls.length > 0 
        ? dayCalls.reduce((sum, call) => sum + call.riskScore, 0) / dayCalls.length 
        : 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        avgRiskScore: Number(avgRiskScore.toFixed(1)),
        callCount: dayCalls.length
      };
    });

    // Enhanced category breakdown with sample evidence
    const categoryData = issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = {
          count: 0,
          regReferences: new Set(),
          evidenceSnippets: []
        };
      }
      acc[issue.category].count++;
      if (issue.regReference) acc[issue.category].regReferences.add(issue.regReference);
      // Use rationale as sample evidence for now
      if (issue.rationale) acc[issue.category].evidenceSnippets.push(issue.rationale);
      return acc;
    }, {} as Record<string, { count: number; regReferences: Set<string>; evidenceSnippets: string[] }>);

    const categoryBreakdown = Object.entries(categoryData).map(([name, data], index) => ({
      name,
      value: data.count,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6b7280'][index % 5],
      regReference: Array.from(data.regReferences)[0],
      evidenceSnippet: data.evidenceSnippets[0]
    }));

    // Severity distribution with enhanced data
    const severityData = issues.reduce((acc, issue) => {
      const severity = issue.severity || 'unknown';
      if (!acc[severity]) {
        acc[severity] = {
          count: 0,
          regReferences: new Set(),
          evidenceSnippets: []
        };
      }
      acc[severity].count++;
      if (issue.regReference) acc[severity].regReferences.add(issue.regReference);
      // Use rationale as sample evidence for now
      if (issue.rationale) acc[severity].evidenceSnippets.push(issue.rationale);
      return acc;
    }, {} as Record<string, { count: number; regReferences: Set<string>; evidenceSnippets: string[] }>);

    const severityDistribution = ['critical', 'high', 'medium', 'low'].map(severity => ({
      severity,
      count: severityData[severity]?.count || 0,
      regReference: Array.from(severityData[severity]?.regReferences || [])[0],
      evidenceSnippet: severityData[severity]?.evidenceSnippets?.[0]
    }));

    return {
      totalCalls: calls.length,
      totalIssues: issues.length,
      avgRiskScore: calls.reduce((sum, call) => sum + call.riskScore, 0) / calls.length || 0,
      dailyRiskData,
      categoryBreakdown,
      severityDistribution,
      complianceRate: Math.max(0, 100 - (calls.reduce((sum, call) => sum + call.riskScore, 0) / calls.length || 0))
    };
  }, [calls, issues]);

  if (callsLoading || issuesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">Record some calls to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Criteria Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Compliance Analytics
          </h1>
          <p className="text-muted-foreground">Real-time insights into regulatory compliance</p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30">
              <Info className="w-4 h-4 mr-2" />
              Criteria
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[600px] sm:w-[800px]">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Compliance Criteria</span>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-800 flex items-center space-x-2">
                      <AlertOctagon className="w-5 h-5" />
                      <span>Performance Guarantees</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-red-700">Language suggesting guaranteed returns or "sure thing" investments</p>
                    <Badge variant="outline" className="text-xs">SEC Rule 206(4)-1</Badge>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-800 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Unsuitable Advice</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-orange-700">Investment recommendations without proper suitability assessment</p>
                    <Badge variant="outline" className="text-xs">FINRA Rule 2111</Badge>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-800 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Risk Disclosure</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-yellow-700">Inadequate or missing risk warnings and disclaimers</p>
                    <Badge variant="outline" className="text-xs">SEC Rule 10b-5</Badge>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-blue-800 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Misleading Statements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-blue-700">False or misleading information about investments or markets</p>
                    <Badge variant="outline" className="text-xs">Securities Act 1933</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-8 h-8 text-primary" />
              <div>
                <p className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={analyticsData.totalCalls} />
                </p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-3xl font-bold text-red-600">
                  <AnimatedCounter value={analyticsData.totalIssues} />
                </p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-3xl font-bold text-amber-600">
                  <AnimatedCounter value={analyticsData.avgRiskScore} decimals={1} />
                </p>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-3xl font-bold text-green-600">
                  <AnimatedCounter value={analyticsData.complianceRate} decimals={0} suffix="%" />
                </p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Risk Trend */}
      <Card 
        ref={riskTrendRef}
        className={`transition-all duration-1000 ${
          riskTrendInView 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        } border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5`}
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">📈 Risk Trend Analysis</CardTitle>
          <p className="text-muted-foreground">Average risk scores over the last 7 days</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={analyticsData.dailyRiskData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{label}</p>
                        <p className="text-primary">Risk Score: {data.avgRiskScore}</p>
                        <p className="text-muted-foreground text-sm">Calls: {data.callCount}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="avgRiskScore" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 2: Category Breakdown */}
      <Card 
        ref={categoryRef}
        className={`transition-all duration-1000 delay-300 ${
          categoryInView 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        } border-2 border-accent/20 bg-gradient-to-br from-background to-accent/5`}
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold text-accent-foreground">🎯 Category Breakdown</CardTitle>
          <p className="text-muted-foreground">Distribution of compliance issues by category</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-[250px]">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-primary">Count: {data.value}</p>
                          {data.regReference && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">{data.regReference}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {analyticsData.categoryBreakdown.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-muted/20 to-muted/10">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: category.color }}>
                      {category.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((category.value / analyticsData.totalIssues) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Severity Distribution */}
      <Card 
        ref={severityRef}
        className={`transition-all duration-1000 delay-600 ${
          severityInView 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        } border-2 border-destructive/20 bg-gradient-to-br from-background to-destructive/5`}
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold text-destructive">⚡ Severity Distribution</CardTitle>
          <p className="text-muted-foreground">Breakdown of issues by severity level</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={analyticsData.severityDistribution.filter(s => s.count > 0)}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" />
                <YAxis dataKey="severity" type="category" width={80} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold capitalize">{label} Severity</p>
                          <p className="text-primary">Count: {data.count}</p>
                          {data.regReference && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">{data.regReference}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Severity Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                {analyticsData.severityDistribution.map((item) => (
                  <SeverityBadge
                    key={item.severity}
                    severity={item.severity}
                    count={item.count}
                    regReference={item.regReference}
                    evidenceSnippet={item.evidenceSnippet}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};