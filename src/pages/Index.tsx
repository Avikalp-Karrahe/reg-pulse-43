import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Welcome to RegCompliance
            </h1>
            <p className="text-muted-foreground text-lg">
              AI-powered compliance monitoring for financial services
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-muted-foreground">
              Live voice analysis with instant compliance alerts
            </p>
          </div>
          
          <div className="p-6 rounded-lg border border-border bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Risk Analysis</h3>
            <p className="text-muted-foreground">
              Comprehensive risk scoring and categorization
            </p>
          </div>
          
          <div className="p-6 rounded-lg border border-border bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Audit Trail</h3>
            <p className="text-muted-foreground">
              Complete compliance history and reporting
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
