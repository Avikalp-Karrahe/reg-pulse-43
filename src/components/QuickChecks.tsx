import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileText, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const QuickChecks = () => {
  const { toast } = useToast();

  const testChecks = [
    {
      id: 'audio-upload',
      title: 'Audio Upload Test',
      description: 'Upload clip saying "20% monthly, guaranteed"',
      expected: 'HIGH Performance Guarantees (SEC 206(4)-1) + risk spike',
      status: 'pending',
      action: 'Upload audio file with guarantee language'
    },
    {
      id: 'unsuitable-advice',
      title: 'Unsuitable Advice Detection', 
      description: 'Upload "perfect for everyone"',
      expected: 'MED Unsuitable Advice (FINRA 2111)',
      status: 'pending',
      action: 'Test suitability violation detection'
    },
    {
      id: 'evidence-lens',
      title: 'EvidenceLens Interaction',
      description: 'History row opens EvidenceLens',
      expected: 'Shows snippet + rationale + timestamp',
      status: 'ready',
      action: 'Click any issue row in history'
    },
    {
      id: 'analytics-scroll',
      title: 'Analytics Scroll Animation',
      description: 'Analytics reveals 3 sections with data',
      expected: 'Scroll-triggered animations with counters',
      status: 'ready',
      action: 'Navigate to Analytics and scroll'
    },
    {
      id: 'pdf-export',
      title: 'PDF Export Functionality',
      description: 'Export PDF downloads with issues table',
      expected: 'PDF file with compliance report',
      status: 'ready',
      action: 'Click Export PDF button in call details'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'passed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRunCheck = (checkId: string) => {
    const check = testChecks.find(c => c.id === checkId);
    if (!check) return;

    switch (checkId) {
      case 'audio-upload':
        toast({
          title: "Audio Upload Test",
          description: "Navigate to /record tab and use the file upload feature to test with sample audio containing guarantee language.",
        });
        break;
      
      case 'unsuitable-advice':
        toast({
          title: "Unsuitable Advice Test", 
          description: "Use the test scenarios above or upload audio with 'perfect for everyone' language.",
        });
        break;
        
      case 'evidence-lens':
        toast({
          title: "EvidenceLens Test",
          description: "Click on any compliance issue row in the Risk Analysis Table to open the EvidenceLens modal.",
        });
        break;
        
      case 'analytics-scroll':
        toast({
          title: "Analytics Animation Test",
          description: "Navigate to the Analytics page and scroll down to see the animated sections.",
        });
        break;
        
      case 'pdf-export':
        toast({
          title: "PDF Export Test",
          description: "Generate some compliance issues first, then click the 'Export PDF' button in the Risk Analysis Table.",
        });
        break;
    }
  };

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
          <CheckCircle className="w-5 h-5" />
          <span>Quick Validation Checks</span>
        </CardTitle>
        <p className="text-sm text-green-700 dark:text-green-300">
          Verify all system components are working correctly
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testChecks.map((check) => (
            <Card key={check.id} className="border border-border/50 bg-background/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{check.title}</h4>
                    <Badge variant="outline" className={getStatusColor(check.status)}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <div className="mb-2">
                      <strong>Test:</strong> {check.description}
                    </div>
                    <div className="text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/20 p-2 rounded">
                      <strong>Expected:</strong> {check.expected}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleRunCheck(check.id)}
                    size="sm"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:from-green-500/20 hover:to-emerald-500/20"
                  >
                    <TestTube className="w-3 h-3 mr-2" />
                    Guide Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Test Workflow</span>
          </h4>
          <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
            <li>Run automated compliance tests using the Test Scenarios above</li>
            <li>Upload sample audio files to test voice-to-text and analysis</li>
            <li>Click on detected issues to verify EvidenceLens functionality</li>
            <li>Navigate to Analytics to test scroll animations</li>
            <li>Export PDF reports to verify document generation</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};