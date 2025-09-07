import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Play } from "lucide-react";

const callHistory = [
  { id: "CALL-2024-001", date: "2024-01-15", duration: "23:45", riskScore: 8, status: "Low Risk" },
  { id: "CALL-2024-002", date: "2024-01-15", duration: "18:30", riskScore: 35, status: "Medium Risk" },
  { id: "CALL-2024-003", date: "2024-01-14", duration: "31:20", riskScore: 75, status: "High Risk" },
  { id: "CALL-2024-004", date: "2024-01-14", duration: "15:12", riskScore: 12, status: "Low Risk" },
  { id: "CALL-2024-005", date: "2024-01-13", duration: "42:18", riskScore: 89, status: "Critical Risk" },
];

export const CallHistoryPage = () => {
  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-risk-safe-text bg-risk-safe';
    if (score <= 40) return 'text-risk-low-text bg-risk-low';
    if (score <= 60) return 'text-risk-medium-text bg-risk-medium';
    if (score <= 80) return 'text-risk-high-text bg-risk-high';
    return 'text-risk-critical-text bg-risk-critical';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Call History</h1>
        <p className="text-muted-foreground">Review past call recordings and compliance analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {callHistory.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{call.id}</div>
                  <div className="text-sm text-muted-foreground">
                    {call.date} • {call.duration}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getRiskColor(call.riskScore)}>
                    {call.status}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};