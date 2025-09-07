import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react';

interface ComplianceIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rationale: string;
  evidenceSnippet: string;
  reg_reference: string;
  timestamp: string;
}

interface ComplianceChecklistProps {
  complianceIssues: ComplianceIssue[];
  isActive: boolean;
}

// Define compliance categories to monitor
const COMPLIANCE_CATEGORIES = [
  {
    id: 'performance_guarantees',
    name: 'Performance Guarantees',
    description: 'No promises of specific returns or performance',
    regulation: 'SEC Rule 10b-5'
  },
  {
    id: 'risk_disclosure',
    name: 'Risk Disclosure',
    description: 'Proper disclosure of investment risks',
    regulation: 'FINRA Rule 2111'
  },
  {
    id: 'suitability',
    name: 'Suitability Assessment',
    description: 'Ensuring recommendations match client profile',
    regulation: 'FINRA Rule 2111'
  },
  {
    id: 'conflict_disclosure',
    name: 'Conflict of Interest',
    description: 'Disclosure of potential conflicts',
    regulation: 'FINRA Rule 2241'
  },
  {
    id: 'record_keeping',
    name: 'Record Keeping',
    description: 'Proper documentation of communications',
    regulation: 'SEC Rule 17a-4'
  },
  {
    id: 'client_information',
    name: 'Client Information Security',
    description: 'Protection of sensitive client data',
    regulation: 'FINRA Rule 3110'
  },
  {
    id: 'market_manipulation',
    name: 'Market Manipulation',
    description: 'No misleading or manipulative statements',
    regulation: 'SEC Rule 10b-5'
  },
  {
    id: 'licensing_compliance',
    name: 'Licensing & Registration',
    description: 'Operating within licensed capacity',
    regulation: 'FINRA Series Licensing'
  }
];

export const ComplianceChecklist = ({ complianceIssues, isActive }: ComplianceChecklistProps) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, 'safe' | 'warning' | 'violation'>>({});

  // Update checklist based on detected issues
  useEffect(() => {
    const newCheckedItems: Record<string, 'safe' | 'warning' | 'violation'> = {};
    
    // Initialize all as safe
    COMPLIANCE_CATEGORIES.forEach(category => {
      newCheckedItems[category.id] = 'safe';
    });

    // Check for violations
    complianceIssues.forEach(issue => {
      const categoryId = COMPLIANCE_CATEGORIES.find(cat => 
        cat.name.toLowerCase().includes(issue.category.toLowerCase()) ||
        issue.category.toLowerCase().includes(cat.name.toLowerCase())
      )?.id;

      if (categoryId) {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          newCheckedItems[categoryId] = 'violation';
        } else if (issue.severity === 'medium' && newCheckedItems[categoryId] !== 'violation') {
          newCheckedItems[categoryId] = 'warning';
        }
      }
    });

    setCheckedItems(newCheckedItems);
  }, [complianceIssues]);

  const getStatusIcon = (status: 'safe' | 'warning' | 'violation') => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'violation':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'safe' | 'warning' | 'violation') => {
    switch (status) {
      case 'safe':
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'violation':
        return 'border-red-500/30 bg-red-500/5 animate-pulse';
    }
  };

  const violationCount = Object.values(checkedItems).filter(status => status === 'violation').length;
  const warningCount = Object.values(checkedItems).filter(status => status === 'warning').length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg text-primary flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Compliance Checklist
          {isActive && (
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs animate-pulse">
              LIVE
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
            {violationCount} Violations
          </Badge>
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            {warningCount} Warnings
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {COMPLIANCE_CATEGORIES.map(category => {
            const status = checkedItems[category.id] || 'safe';
            return (
              <div
                key={category.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${getStatusColor(status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {category.name}
                      </h4>
                      <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground border-muted">
                        {category.regulation}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {category.description}
                    </p>
                    {status === 'violation' && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                        <span className="text-red-400 font-medium">
                          ⚠️ VIOLATION DETECTED - Review conversation immediately
                        </span>
                      </div>
                    )}
                    {status === 'warning' && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                        <span className="text-yellow-400 font-medium">
                          ⚠️ Potential concern - Monitor closely
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};