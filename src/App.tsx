import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { toast as sonner } from "sonner";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { CallHistoryPage } from "@/components/CallHistoryPage";
import { LazyAnalytics } from "@/components/LazyAnalytics";
import { AudioInputSetup } from "@/components/AudioInputSetup";
import { LandingPage } from "@/components/LandingPage";
import { DemoBanner } from "@/components/DemoBanner";
import { AgentOpsConsole } from "@/components/AgentOpsConsole";
import { LazyPresenterPanel } from "@/components/LazyPresenterPanel";
import { AppSidebar } from "@/components/AppSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import { NavLink } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { demoStore } from "@/demo/demoStore";

const queryClient = new QueryClient();

export const App = () => {
  const [isAgentOpsOpen, setIsAgentOpsOpen] = useState(false);
  const [presenterPanelOpen, setPresenterPanelOpen] = useState(false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'o' || e.key === 'O') {
        setIsAgentOpsOpen(prev => !prev);
      }
      if (e.key === 'p' || e.key === 'P') {
        setPresenterPanelOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if demo mode is active - always true for this demo app
  const isDemoActive = () => true;

  // Main app layout component
  const MainAppLayout = ({ children }: { children: React.ReactNode }) => (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background particles-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Demo Banner */}
          {isDemoActive() && (
            <DemoBanner className="mx-6 mt-4" />
          )}
          
          {/* Header */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">RC</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">RegCompliance</h1>
                  <p className="text-xs text-muted-foreground">Financial Compliance Monitoring</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAgentOpsOpen(!isAgentOpsOpen)}
                className="px-3 py-1 text-xs font-mono border rounded hover:bg-accent transition-colors"
                title="Toggle Agent Ops Console (Press 'O')"
              >
                Agent Ops {isAgentOpsOpen ? '🟢' : '⚫'}
              </button>
              <button
                onClick={() => setPresenterPanelOpen(!presenterPanelOpen)}
                className="px-3 py-1 text-xs font-mono border rounded hover:bg-accent transition-colors"
                title="Toggle Presenter Panel (Press 'P')"
              >
                Presenter {presenterPanelOpen ? '🟢' : '⚫'}
              </button>
              <NavLink 
                to="/settings" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Audio Settings
              </NavLink>
              {isDemoActive() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  DEMO
                </span>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main id="main-content" className="flex-1 p-6 focus:outline-none" tabIndex={-1}>
            {children}
          </main>
        </div>
        
        <AgentOpsConsole 
          isOpen={isAgentOpsOpen} 
          onClose={() => setIsAgentOpsOpen(false)} 
        />
        <LazyPresenterPanel 
          isOpen={presenterPanelOpen} 
          onClose={() => setPresenterPanelOpen(false)} 
        />
      </div>
    </SidebarProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Landing page without sidebar */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Main app pages with sidebar */}
            <Route path="/dashboard" element={
              <MainAppLayout>
                <ComplianceDashboard />
              </MainAppLayout>
            } />
            
            <Route path="/history" element={
              <MainAppLayout>
                <CallHistoryPage />
              </MainAppLayout>
            } />
            
            <Route path="/analytics" element={
              <MainAppLayout>
                <LazyAnalytics />
              </MainAppLayout>
            } />
            
            <Route path="/settings" element={
              <MainAppLayout>
                <ErrorBoundary>
                  <AudioInputSetup />
                </ErrorBoundary>
              </MainAppLayout>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;