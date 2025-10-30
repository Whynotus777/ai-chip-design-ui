import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard";
import AgentFlow from "./pages/AgentFlow";
import AnalysisDebug from "./pages/AnalysisDebug";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import { useState } from "react";

function Router() {
  const [currentView, setCurrentView] = useState<"dashboard" | "agent-flow" | "analysis" | "knowledge" | "settings">("agent-flow");

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "agent-flow":
        return <AgentFlow />;
      case "analysis":
        return <AnalysisDebug />;
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
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
