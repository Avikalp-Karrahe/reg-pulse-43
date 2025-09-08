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

        {/* Vapi Widget */}
        <div className="mt-12 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary mb-2">Talk with AI Assistant</h2>
            <p className="text-muted-foreground">Get instant compliance guidance and support</p>
          </div>
          <vapi-widget
            public-key="5109d358-3f22-41c2-bd0e-70e059604e6a"
            assistant-id="e263a068-6f1c-44dd-adc7-bfef527f50bb"
            mode="voice"
            theme="dark"
            base-bg-color="#000000"
            accent-color="#14B8A6"
            cta-button-color="#000000"
            cta-button-text-color="#ffffff"
            border-radius="large"
            size="medium"
            position="inline"
            title="TALK WITH AI"
            start-button-text="Start"
            end-button-text="End Call"
            chat-first-message="Hey, how can I help you today?"
            chat-placeholder="Type your message..."
            voice-show-transcript="true"
            consent-required="true"
            consent-title="Terms and conditions"
            consent-content="By clicking Agree, and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as otherwise described in our Terms of Service."
            consent-storage-key="vapi_widget_consent"
          ></vapi-widget>
        </div>
      </div>
    </div>
  );
};

export default Index;
