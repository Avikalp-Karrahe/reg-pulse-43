import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { CallHistoryPage } from "@/components/CallHistoryPage";
import { Analytics } from "@/components/Analytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
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
              </header>

              {/* Main Content */}
              <main className="flex-1 p-6">
                <Routes>
                  <Route path="/" element={<ComplianceDashboard />} />
                  <Route path="/history" element={<CallHistoryPage />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
