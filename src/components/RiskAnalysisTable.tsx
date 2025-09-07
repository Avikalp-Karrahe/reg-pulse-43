import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, User, UserCheck, AlertTriangle, Shield, TrendingUp, Download } from "lucide-react";
import { EvidenceLens } from "./EvidenceLens";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplianceIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  reg_reference: string;
  timestamp: string;
  evidenceSnippet?: string | null;
  evidenceStartMs?: number | null;
  evidenceEndMs?: number | null;
  modelRationale?: string | null;
  modelVersion?: string | null;
  evidence_snippet?: string;
  evidence_start_ms?: number;
  evidence_end_ms?: number;
  model_rationale?: string;
}

interface RiskAnalysisTableProps {
  callId: string;
  issues: ComplianceIssue[];
}

export const RiskAnalysisTable = ({ callId, issues }: RiskAnalysisTableProps) => {
  const [selectedIssue, setSelectedIssue] = useState<ComplianceIssue | null>(null);
  const [isEvidenceLensOpen, setIsEvidenceLensOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleRowClick = (issue: ComplianceIssue) => {
    setSelectedIssue(issue);
    setIsEvidenceLensOpen(true);
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      const { data, error } = await supabase.functions.invoke('export-audit-pdf', {
        body: { call_id: callId }
      });

      if (error) {
        throw error;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-report-${callId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Export Successful",
        description: "The audit report has been downloaded to your device.",
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  // Always show demo violations for demonstration purposes
  const demoViolations = [
    {
      id: "demo-1",
      timestamp: "14:32",
      speaker: "advisor",
      riskLevel: "critical",
      text: "I can almost guarantee you'll see returns like that based on our track record. This is a sure thing.",
      issue: "Performance Guarantees",
      regulation: "SEC 10b-5",
      severity: "critical",
      recommendation: "Remove guarantee language, use historical performance data with proper disclaimers"
    },
    {
      id: "demo-2",
      timestamp: "16:45",
      speaker: "advisor",
      riskLevel: "high",
      text: "You should invest as much as possible to maximize your gains. Maybe liquidate some of your other investments?",
      issue: "Unsuitable Investment Advice",
      regulation: "FINRA 2111",
      severity: "high",
      recommendation: "Conduct proper suitability assessment before making investment recommendations"
    },
    {
      id: "demo-3",
      timestamp: "12:18",
      speaker: "advisor",
      riskLevel: "high",
      text: "We need to act fast on this opportunity. The market won't wait, and neither should you!",
      issue: "Pressure / Urgency Tactics",
      regulation: "UDAAP",
      severity: "high",
      recommendation: "Remove high-pressure language and allow customers adequate time to make decisions"
    },
    {
      id: "demo-4",
      timestamp: "18:22",
      speaker: "advisor",
      riskLevel: "medium",
      text: "While I can't guarantee specific percentages, some of our growth portfolios have historically performed well.",
      issue: "Inadequate Risk Disclosure",
      regulation: "FTC Guides",
      severity: "medium",
      recommendation: "Include comprehensive risk disclosures and past performance disclaimers"
    },
    {
      id: "demo-5",
      timestamp: "20:15",
      speaker: "advisor",
      riskLevel: "high",
      text: "Our fund has never had a down year - it's basically risk-free with these returns.",
      issue: "Misleading Statements",
      regulation: "SEC 10b-5",
      severity: "high",
      recommendation: "Provide accurate historical data including losses and proper risk disclaimers"
    },
    {
      id: "demo-6",
      timestamp: "22:33",
      speaker: "advisor",
      riskLevel: "medium",
      text: "I recommend frequent trading to capitalize on market movements for maximum profit.",
      issue: "Excessive Trading (Churning)",
      regulation: "FINRA 2111",
      severity: "medium",
      recommendation: "Ensure trading frequency aligns with client objectives and disclose associated costs"
    },
    {
      id: "demo-7",
      timestamp: "25:10",
      speaker: "advisor",
      riskLevel: "high",
      text: "I have a personal stake in this investment, but it's still the best option for you.",
      issue: "Conflicts of Interest",
      regulation: "IA Act Rule 206(4)-7",
      severity: "high",
      recommendation: "Fully disclose all conflicts of interest before making recommendations"
    },
    {
      id: "demo-8",
      timestamp: "27:45",
      speaker: "advisor",
      riskLevel: "critical",
      text: "I'll go ahead and execute these trades for you since we discussed it.",
      issue: "Unauthorized Trading",
      regulation: "FINRA 3260",
      severity: "critical",
      recommendation: "Obtain explicit written authorization before executing any trades"
    }
  ];

  // Combine real issues with demo violations for demonstration
  const realIssues = issues.map((issue, index) => ({
    id: `${callId}-${index}`,
    timestamp: issue.timestamp,
    speaker: 'advisor',
    riskLevel: issue.severity,
    text: `Statement containing ${issue.category.toLowerCase()} language`,
    issue: issue.category,
    regulation: issue.reg_reference,
    severity: issue.severity,
    recommendation: issue.rationale
  }));

  const riskAnalysis = [...realIssues, ...demoViolations];

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
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalIssues = riskAnalysis.length;
  const criticalIssues = riskAnalysis.filter(item => item.severity === 'critical').length;
  const highIssues = riskAnalysis.filter(item => item.severity === 'high').length;
  const mediumRisks = riskAnalysis.filter(item => item.severity === 'medium').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Critical Issues</p>
                <p className="text-xl font-bold text-red-600">{criticalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">High/Medium Risks</p>
                <p className="text-xl font-bold text-orange-600">{highIssues + mediumRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Issues</p>
                <p className="text-xl font-bold">{totalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Overall Risk</p>
                <p className="text-xl font-bold">{criticalIssues > 0 ? 'HIGH' : highIssues > 0 ? 'MEDIUM' : 'LOW'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle>Detailed Risk Analysis</CardTitle>
              <Badge variant="outline" className="text-xs">
                {totalIssues} {totalIssues === 1 ? 'Issue' : 'Issues'} Found
              </Badge>
            </div>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 hover:from-primary/20 hover:to-primary/30"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalIssues > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[80px]">Speaker</TableHead>
                  <TableHead className="w-[100px]">Risk Level</TableHead>
                  <TableHead className="w-[150px]">Issue Type</TableHead>
                  <TableHead className="w-[120px]">Regulation</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Statement</TableHead>
                  <TableHead className="w-[200px]">Evidence</TableHead>
                  <TableHead className="w-[150px]">Model Info</TableHead>
                  <TableHead>Action Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskAnalysis.map((item, index) => {
                  const originalIssue = issues[index];
                  return (
                    <TableRow 
                      key={item.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => originalIssue && handleRowClick(originalIssue)}
                    >
                      <TableCell className="font-mono text-xs">{item.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {item.speaker === 'advisor' ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        <span className="text-xs capitalize">{item.speaker}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(item.riskLevel)} variant="outline">
                        {item.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.issue}</TableCell>
                    <TableCell className="text-xs font-mono">{item.regulation}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(item.severity)} variant="outline">
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[300px]">
                      <div className="truncate" title={item.text}>
                        {item.text}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px]">
                      {issues.find(issue => issue.category === item.issue)?.evidenceSnippet ? (
                        <div className="space-y-1">
                          <div className="truncate" title={issues.find(issue => issue.category === item.issue)?.evidenceSnippet || ''}>
                            {issues.find(issue => issue.category === item.issue)?.evidenceSnippet}
                          </div>
                          {issues.find(issue => issue.category === item.issue)?.evidenceStartMs && (
                            <div className="text-xs text-muted-foreground">
                              {Math.floor((issues.find(issue => issue.category === item.issue)?.evidenceStartMs || 0) / 1000)}s - {Math.floor((issues.find(issue => issue.category === item.issue)?.evidenceEndMs || 0) / 1000)}s
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No evidence</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[150px]">
                      {issues.find(issue => issue.category === item.issue)?.modelVersion ? (
                        <div className="space-y-1">
                          <div className="font-mono">
                            {issues.find(issue => issue.category === item.issue)?.modelVersion}
                          </div>
                          {issues.find(issue => issue.category === item.issue)?.modelRationale && (
                            <div className="truncate" title={issues.find(issue => issue.category === item.issue)?.modelRationale || ''}>
                              {issues.find(issue => issue.category === item.issue)?.modelRationale}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[250px]">
                      <div className="truncate" title={item.recommendation}>
                        {item.recommendation}
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <h3 className="text-lg font-medium">No Issues Detected</h3>
              <p className="text-sm">The call analysis hasn't identified any compliance concerns yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {(criticalIssues > 0 || highIssues > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Priority Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAnalysis
                .filter(item => item.severity === 'critical' || item.severity === 'high')
                .map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800">{item.issue}</h4>
                        <p className="text-sm text-red-700 mt-1">{item.recommendation}</p>
                        <div className="text-xs text-red-600 mt-1">
                          Regulation: {item.regulation} • Severity: {item.severity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Lens Dialog */}
      <EvidenceLens
        isOpen={isEvidenceLensOpen}
        onClose={() => setIsEvidenceLensOpen(false)}
        issue={selectedIssue}
      />
    </div>
  );
};