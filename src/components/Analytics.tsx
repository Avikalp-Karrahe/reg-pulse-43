import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, AlertTriangle, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useCalls } from "@/hooks/useCalls";
import { useAllIssues } from "@/hooks/useIssues";
import { useMemo } from "react";

export const Analytics = () => {
  const { data: calls, isLoading: callsLoading } = useCalls();
  const { data: issues, isLoading: issuesLoading } = useAllIssues();

  // Calculate analytics data from real Supabase data
  const analyticsData = useMemo(() => {
    if (!calls || !issues) return null;

    // Calculate issue distribution by category
    const categoryCount = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const issueTypesData = Object.entries(categoryCount).map(([name, value], index) => ({
      name,
      value,
      color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6b7280'][index % 5],
    }));

    // Calculate severity breakdown
    const severityCount = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate risk score trends by weeks (last 4 weeks)
    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const recentIssues = issues.filter(issue => 
      new Date(issue.timestamp) >= fourWeeksAgo
    );

    const weeklyData = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(fourWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekIssues = recentIssues.filter(issue => {
        const issueDate = new Date(issue.timestamp);
        return issueDate >= weekStart && issueDate < weekEnd;
      });

      const severityCounts = weekIssues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        week: `Week ${i + 1}`,
        critical: severityCounts.critical || 0,
        high: severityCounts.high || 0,
        medium: severityCounts.medium || 0,
        low: severityCounts.low || 0,
      };
    });

    // Calculate compliance metrics
    const totalCalls = calls.length;
    const totalIssues = issues.length;
    const avgRiskScore = calls.reduce((sum, call) => sum + call.riskScore, 0) / totalCalls || 0;
    const avgDuration = calls
      .filter(call => call.duration !== 'N/A')
      .reduce((sum, call) => {
        const [mins, secs] = call.duration.split(':').map(Number);
        return sum + (mins * 60 + secs);
      }, 0) / totalCalls || 0;

    return {
      totalCalls,
      totalIssues,
      avgRiskScore,
      avgDuration: avgDuration / 60, // Convert to minutes
      issueTypesData,
      severityCount,
      weeklyData,
      complianceRate: Math.max(0, 100 - avgRiskScore),
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{analyticsData.totalCalls}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{analyticsData.totalIssues}</p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{analyticsData.avgDuration.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg Call Duration (min)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{analyticsData.complianceRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls and Issues Over Time */}
        <Card>
        <CardHeader>
          <CardTitle>Issue Severity Trends (Last 4 Weeks)</CardTitle>
        </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="critical" fill="#ef4444" name="Critical" stackId="a" />
                <Bar dataKey="high" fill="#f97316" name="High" stackId="a" />
                <Bar dataKey="medium" fill="#eab308" name="Medium" stackId="a" />
                <Bar dataKey="low" fill="#22c55e" name="Low" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issue Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.issueTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.issueTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Level Trends (Last 4 Weeks)</CardTitle>
        </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} name="Low" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Risk Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calls && calls.slice(0, 4).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{call.callId}</p>
                      <p className="text-xs text-muted-foreground">{call.date} • {call.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      call.riskScore >= 80 ? 'text-red-700 border-red-200 bg-red-50' :
                      call.riskScore >= 60 ? 'text-orange-700 border-orange-200 bg-orange-50' :
                      'text-yellow-700 border-yellow-200 bg-yellow-50'
                    }>
                      {call.issueCount} issues
                    </Badge>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-4">No high-risk calls recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.issueTypesData.map((category) => {
                const percentage = (category.value / analyticsData.totalIssues) * 100;
                return (
                  <div key={category.name} className="flex items-center justify-between">
                    <span className="text-sm">{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: category.color 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm" style={{ color: category.color }}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {analyticsData.issueTypesData.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No compliance data available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};