import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Clock, User, UserCheck, Download, Eye } from "lucide-react";

interface RiskAnalysisTableProps {
  callId: string;
}

export const RiskAnalysisTable = ({ callId }: RiskAnalysisTableProps) => {
  const riskAnalysis = [
    {
      id: "1",
      timestamp: "14:32",
      speaker: "advisor",
      riskLevel: "critical",
      text: "I can almost guarantee you'll see returns like that based on our track record. This is a sure thing.",
      issue: "Performance Guarantee",
      regulation: "SEC Rule 206(4)-1",
      severity: "High",
      recommendation: "Remove guarantee language, use historical performance data with proper disclaimers"
    },
    {
      id: "2",
      timestamp: "16:45",
      speaker: "advisor",
      riskLevel: "high",
      text: "You should invest as much as possible to maximize your gains. Maybe liquidate some of your other investments?",
      issue: "Unsuitable Investment Advice",
      regulation: "FINRA Rule 2111",
      severity: "High",
      recommendation: "Conduct proper suitability assessment before making investment recommendations"
    },
    {
      id: "3",
      timestamp: "12:18",
      speaker: "advisor",
      riskLevel: "medium",
      text: "While I can't guarantee specific percentages, some of our growth portfolios have historically performed well.",
      issue: "Inadequate Risk Disclosure",
      regulation: "SEC Rule 10b-5",
      severity: "Medium",
      recommendation: "Include comprehensive risk disclosures and past performance disclaimers"
    },
    {
      id: "4",
      timestamp: "08:45",
      speaker: "advisor",
      riskLevel: "low",
      text: "We offer a range of products suitable for different risk profiles.",
      issue: "Generic Product Description",
      regulation: "FINRA Rule 2210",
      severity: "Low",
      recommendation: "Provide specific product details and risk characteristics"
    }
  ];

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300 font-semibold';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'text-yellow-600 bg-yellow-50';
      case 'Medium': return 'text-orange-600 bg-orange-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">  
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">1</p>
                <p className="text-sm text-muted-foreground">Medium Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">23:45</p>
                <p className="text-sm text-muted-foreground">Call Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-red-600">75%</p>
                <p className="text-sm text-muted-foreground">Overall Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Risk Analysis</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Transcript
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Speaker</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead>Regulation</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Statement</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskAnalysis.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {item.timestamp}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {item.speaker === 'advisor' ? (
                        <UserCheck className="w-4 h-4 text-blue-500" />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm">
                        {item.speaker === 'advisor' ? 'Advisor' : 'Client'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskBadgeColor(item.riskLevel)} variant="outline">
                      {item.riskLevel.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.issue}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.regulation}
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(item.severity)} variant="outline">
                      {item.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[300px] max-w-[400px]">
                    <div className="text-sm bg-muted/30 p-2 rounded">
                      <p className="break-words whitespace-normal">
                        "{item.text}"
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {(item.riskLevel === 'high' || item.riskLevel === 'critical') && (
                        <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                          Send Clarification
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskAnalysis.filter(item => item.riskLevel === 'critical' || item.riskLevel === 'high').map((item) => (
              <div key={item.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">{item.issue}</h4>
                    <p className="text-sm text-orange-700 mt-1">{item.recommendation}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {item.regulation}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Timestamp: {item.timestamp}
                      </span>
                    </div>
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