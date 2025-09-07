import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Phone, AlertTriangle, Clock, TrendingUp, Users, FileText } from "lucide-react";

const callsData = [
  { month: 'Jan', calls: 45, issues: 12 },
  { month: 'Feb', calls: 52, issues: 8 },
  { month: 'Mar', calls: 38, issues: 15 },
  { month: 'Apr', calls: 61, issues: 22 },
  { month: 'May', calls: 55, issues: 18 },
  { month: 'Jun', calls: 67, issues: 9 }
];

const issueTypesData = [
  { name: 'Performance Guarantees', value: 35, color: '#ef4444' },
  { name: 'Unsuitable Advice', value: 28, color: '#f97316' },
  { name: 'Risk Disclosure', value: 20, color: '#eab308' },
  { name: 'Product Description', value: 12, color: '#22c55e' },
  { name: 'Other', value: 5, color: '#6b7280' }
];

const riskTrendsData = [
  { week: 'Week 1', critical: 5, high: 8, medium: 12 },
  { week: 'Week 2', critical: 3, high: 6, medium: 15 },
  { week: 'Week 3', critical: 7, high: 11, medium: 9 },
  { week: 'Week 4', critical: 2, high: 5, medium: 18 }
];

export const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Phone className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">318</p>
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
                <p className="text-2xl font-bold text-red-600">84</p>
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
                <p className="text-2xl font-bold">18.5</p>
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
                <p className="text-2xl font-bold text-green-600">73%</p>
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
            <CardTitle>Calls and Issues Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={callsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#3b82f6" name="Total Calls" />
                <Bar dataKey="issues" fill="#ef4444" name="Issues Found" />
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
                  data={issueTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {issueTypesData.map((entry, index) => (
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
            <LineChart data={riskTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
              <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" />
              <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
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
              {[
                { id: 'CALL-001', time: '2 hours ago', advisor: 'John Smith', issues: 3, severity: 'Critical' },
                { id: 'CALL-002', time: '4 hours ago', advisor: 'Sarah Johnson', issues: 2, severity: 'High' },
                { id: 'CALL-003', time: '6 hours ago', advisor: 'Mike Brown', issues: 1, severity: 'High' },
                { id: 'CALL-004', time: '1 day ago', advisor: 'Lisa Davis', issues: 2, severity: 'Medium' }
              ].map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{call.id}</p>
                      <p className="text-xs text-muted-foreground">{call.advisor} • {call.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={
                      call.severity === 'Critical' ? 'text-red-700 border-red-200 bg-red-50' :
                      call.severity === 'High' ? 'text-orange-700 border-orange-200 bg-orange-50' :
                      'text-yellow-700 border-yellow-200 bg-yellow-50'
                    }>
                      {call.issues} issues
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance Guarantees</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-red-100 rounded-full">
                    <div className="w-8/12 h-full bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-red-600">67%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Unsuitable Advice</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-orange-100 rounded-full">
                    <div className="w-5/12 h-full bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-orange-600">42%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Risk Disclosure</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-yellow-100 rounded-full">
                    <div className="w-3/12 h-full bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-yellow-600">25%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Product Description</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-2 bg-green-100 rounded-full">
                    <div className="w-1/12 h-full bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm text-green-600">8%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};