import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import AgentFlow from "./pages/AgentFlow";
import AnalysisDebug from "./pages/AnalysisDebug";
import RunComparison from "./pages/RunComparison";
import Verification from "./pages/Verification";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

type ViewId = "dashboard" | "agent-flow" | "analysis" | "comparison" | "verification" | "knowledge" | "settings";

function Router() {
  const [currentView, setCurrentView] = useState<ViewId>("agent-flow");

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "agent-flow":
        return <AgentFlow />;
      case "analysis":
        return <AnalysisDebug />;
      case "comparison":
        return <RunComparison />;
      case "verification":
        return <Verification />;
      case "knowledge":
        return <KnowledgeBase />;
      case "settings":
        return <Settings />;
      default:
        return <AgentFlow />;
    }
  };

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </MainLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="dark"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
