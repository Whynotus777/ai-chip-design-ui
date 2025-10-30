import React, { useState } from "react";
import { LayoutDashboard, Zap, Microscope, BookOpen, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: "dashboard" | "agent-flow" | "analysis" | "knowledge" | "settings";
  onViewChange: (view: "dashboard" | "agent-flow" | "analysis" | "knowledge" | "settings") => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "agent-flow", label: "Agent & Flow", icon: Zap },
  { id: "analysis", label: "Analysis & Debug", icon: Microscope },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function MainLayout({ children, currentView, onViewChange }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen bg-card border-r border-border transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 md:w-20"
        )}
      >
        <div className="flex flex-col h-full p-4 overflow-hidden">
          {/* Logo/Header */}
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="font-bold text-lg whitespace-nowrap">ChipDesign AI</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as any);
                    setSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
              <p>v1.0.0</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">
              {navItems.find((item) => item.id === currentView)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
