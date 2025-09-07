import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Play, Loader2 } from "lucide-react";
import { useCalls } from "@/hooks/useCalls";

export const CallHistoryPage = () => {
  const { data: calls, isLoading, error } = useCalls();
  const getRiskColor = (score: number) => {
    if (score <= 20) return 'text-risk-safe-text bg-risk-safe';
    if (score <= 40) return 'text-risk-low-text bg-risk-low';
    if (score <= 60) return 'text-risk-medium-text bg-risk-medium';
    if (score <= 80) return 'text-risk-high-text bg-risk-high';
    return 'text-risk-critical-text bg-risk-critical';
  };

  const getRiskStatus = (score: number) => {
    if (score <= 20) return 'Low Risk';
    if (score <= 40) return 'Medium Risk';
    if (score <= 60) return 'Medium Risk';
    if (score <= 80) return 'High Risk';
    return 'Critical Risk';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading call history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error Loading Calls</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

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
          {calls && calls.length > 0 ? (
            <div className="space-y-4">
              {calls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{call.callId}</div>
                    <div className="text-sm text-muted-foreground">
                      {call.date} • {call.duration} • {call.issueCount} issues
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getRiskColor(call.riskScore)}>
                      {getRiskStatus(call.riskScore)}
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
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No calls recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start your first compliance monitoring session to see call history here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};