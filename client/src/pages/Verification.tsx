import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileCode,
  Activity,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRuns } from "@/hooks/useRuns";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown";

export default function Verification() {
  const { data: runsData } = useRuns();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const runs = runsData?.runs || [];
  const runId = selectedRunId || runs[0]?.run_id || null;

  if (runs.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No RTL runs available. Generate RTL first in the Agent & Flow view.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Center</CardTitle>
              <CardDescription>Generate testbenches, run simulations, and analyze coverage</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={runId || ""}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                {runs.map((run) => (
                  <option key={run.run_id} value={run.run_id}>
                    {run.module_name} - {formatDateTime(run.start_time)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border hover:border-accent transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-sm">Generate Testbench</CardTitle>
                <CardDescription className="text-xs">AI-powered TB generation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Generation
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-accent transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-sm">Run Simulation</CardTitle>
                <CardDescription className="text-xs">Launch Verilator/VCS</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="sm" variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Launch Sim
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border hover:border-accent transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-sm">View Coverage</CardTitle>
                <CardDescription className="text-xs">Analyze test coverage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="sm" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="testbenches" className="w-full">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="testbenches">
            <FileCode className="w-4 h-4 mr-2" />
            Testbenches
          </TabsTrigger>
          <TabsTrigger value="simulations">
            <Activity className="w-4 h-4 mr-2" />
            Simulations
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <BarChart3 className="w-4 h-4 mr-2" />
            Coverage
          </TabsTrigger>
        </TabsList>

        {/* Testbenches Tab */}
        <TabsContent value="testbenches" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Available Testbenches</CardTitle>
              <CardDescription>Generated and uploaded testbenches for this design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No testbenches generated yet.</p>
                <p className="text-sm mt-2">Click "Generate Testbench" above to create one.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulations Tab */}
        <TabsContent value="simulations" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Simulation History</CardTitle>
              <CardDescription>Recent simulation runs and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No simulations run yet.</p>
                <p className="text-sm mt-2">Generate a testbench and run a simulation first.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Coverage Analysis</CardTitle>
              <CardDescription>Code and functional coverage metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No coverage data available.</p>
                <p className="text-sm mt-2">Run a simulation with coverage enabled first.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verification Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Testbenches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">Generated</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-success">0 passed</span> • <span className="text-destructive">0 failed</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-2">Line coverage</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assertions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">Failures detected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
