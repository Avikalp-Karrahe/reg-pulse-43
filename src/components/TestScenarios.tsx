import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Download, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useToolhouseAgent } from "@/hooks/useToolhouseAgent";
import { useState } from "react";

export const TestScenarios = () => {
  const { toast } = useToast();
  const { sendMessage, allIssues, riskScore } = useToolhouseAgent();
  const [isRunningTest, setIsRunningTest] = useState(false);

  const testScenarios = [
    {
      id: 1,
      name: "Performance Guarantee Test",
      input: "I can guarantee you'll see 20% monthly returns. This investment is risk-free and a sure thing based on our track record.",
      expectedIssues: ["Performance Guarantees"],
      expectedSeverity: "HIGH",
      expectedRegulation: "SEC Rule 206(4)-1"
    },
    {
      id: 2,
      name: "Unsuitable Advice Test", 
      input: "This investment is perfect for everyone. You should liquidate all your other investments and put everything here.",
      expectedIssues: ["Unsuitable Investment Advice"],
      expectedSeverity: "MEDIUM", 
      expectedRegulation: "FINRA Rule 2111"
    },
    {
      id: 3,
      name: "Risk Disclosure Test",
      input: "There's practically no downside to this. The market only goes up and you can't lose with this strategy.",
      expectedIssues: ["Inadequate Risk Disclosure"],
      expectedSeverity: "MEDIUM",
      expectedRegulation: "SEC Rule 10b-5"
    },
    {
      id: 4,
      name: "Multiple Violations Test",
      input: "I guarantee 25% returns monthly with zero risk. This is perfect for everyone and you should invest everything you have. It's a sure thing.",
      expectedIssues: ["Performance Guarantees", "Unsuitable Investment Advice"],
      expectedSeverity: "HIGH",
      expectedRegulation: "Multiple"
    }
  ];

  const runTest = async (scenario: typeof testScenarios[0]) => {
    setIsRunningTest(true);
    
    try {
      await sendMessage(scenario.input);
      
      // Wait a moment for analysis to complete
      setTimeout(() => {
        const detectedIssues = allIssues.filter(issue => 
          scenario.expectedIssues.includes(issue.category)
        );
        
        if (detectedIssues.length > 0) {
          toast({
            title: `✅ Test "${scenario.name}" Passed`,
            description: `Detected ${detectedIssues.length} compliance issue(s) as expected.`,
          });
        } else {
          toast({
            title: `❌ Test "${scenario.name}" Failed`,
            description: "No compliance issues detected when they were expected.",
            variant: "destructive",
          });
        }
        setIsRunningTest(false);
      }, 2000);
      
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: "An error occurred while running the test.",
        variant: "destructive",
      });
      setIsRunningTest(false);
    }
  };

  const runAllTests = async () => {
    setIsRunningTest(true);
    
    try {
      for (const scenario of testScenarios) {
        await sendMessage(scenario.input);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setTimeout(() => {
        toast({
          title: "✅ All Tests Completed",
          description: `Detected ${allIssues.length} total compliance issues. Risk Score: ${riskScore}`,
        });
        setIsRunningTest(false);
      }, 2000);
      
    } catch (error) {
      console.error('Tests failed:', error);
      toast({
        title: "Tests Failed",
        description: "An error occurred while running the tests.",
        variant: "destructive",
      });
      setIsRunningTest(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-primary" />
          <span>Compliance Testing Suite</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test compliance detection with sample phrases and scenarios
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30">
              Current Issues: {allIssues.length}
            </Badge>
            <Badge variant="outline" className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30">
              Risk Score: {riskScore}
            </Badge>
          </div>
          <Button
            onClick={runAllTests}
            disabled={isRunningTest}
            className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isRunningTest ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testScenarios.map((scenario) => (
            <Card key={scenario.id} className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{scenario.name}</h4>
                    <Badge variant="outline" className={
                      scenario.expectedSeverity === 'HIGH' 
                        ? 'border-red-500/50 text-red-700 bg-red-50'
                        : 'border-orange-500/50 text-orange-700 bg-orange-50'
                    }>
                      {scenario.expectedSeverity}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                    <strong>Test Input:</strong> "{scenario.input}"
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      <span>Expected: {scenario.expectedIssues.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span>Regulation: {scenario.expectedRegulation}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => runTest(scenario)}
                    disabled={isRunningTest}
                    size="sm"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30 hover:from-primary/20 hover:to-primary/30"
                  >
                    {isRunningTest ? 'Testing...' : 'Run Test'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Test Coverage</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Performance Guarantees</div>
              <div className="text-blue-600 dark:text-blue-400">SEC Rule 206(4)-1</div>
            </div>
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Unsuitable Advice</div>
              <div className="text-blue-600 dark:text-blue-400">FINRA Rule 2111</div>
            </div>
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Risk Disclosure</div>
              <div className="text-blue-600 dark:text-blue-400">SEC Rule 10b-5</div>
            </div>
            <div>
              <div className="font-medium text-blue-800 dark:text-blue-200">Misleading Statements</div>
              <div className="text-blue-600 dark:text-blue-400">Securities Act 1933</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};