import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CheckCircle, XCircle, AlertTriangle, Download, Code, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRuns, useRunDetail, useFileContent, getDownloadUrl } from "@/hooks/useRuns";
import { Skeleton } from "@/components/ui/skeleton";
import { Streamdown } from "streamdown";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown";

export default function AnalysisDebug() {
  const { data: runsData } = useRuns();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Auto-select first run if none selected
  const runId = selectedRunId || runsData?.runs[0]?.run_id || null;

  const { data: runDetail, isLoading: detailLoading } = useRunDetail(runId);
  const { data: styleReview } = useFileContent(runId, "style_review.md");
  const { data: lintReport } = useFileContent(runId, "lint_report.json");
  const { data: synthesisReport } = useFileContent(runId, "synthesis_report.txt");

  if (!runsData || runsData.runs.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No runs available. Start a pipeline in the Agent & Flow view.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (detailLoading) {
    return <AnalysisSkeleton />;
  }

  const runs = runsData.runs;
  const result = runDetail?.result;

  // Parse lint report
  let lintData = null;
  if (lintReport) {
    try {
      lintData = JSON.parse(lintReport.content);
    } catch (e) {
      console.error("Failed to parse lint report:", e);
    }
  }

  // Parse synthesis warnings from report
  const synthesisWarnings = synthesisReport?.content
    ?.split("\n")
    .filter(line => line.includes("Warning:"))
    .map(line => line.trim()) || [];

  return (
    <div className="space-y-6">
      {/* Run Selector */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analysis & Debug</CardTitle>
              <CardDescription>Synthesis results, style review, and lint reports</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={runId || ""}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Synthesis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {result?.synthesis_success ? (
                <>
                  <CheckCircle className="w-8 h-8 text-success" />
                  <div>
                    <div className="text-2xl font-bold text-success">PASS</div>
                    <p className="text-xs text-muted-foreground">Exit code: 0</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-destructive" />
                  <div>
                    <div className="text-2xl font-bold text-destructive">FAIL</div>
                    <p className="text-xs text-muted-foreground">Errors found</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Style Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {styleReview ? (
                <>
                  <AlertTriangle className="w-8 h-8 text-warning" />
                  <div>
                    <div className="text-2xl font-bold">
                      {styleReview.content.match(/Total Violations:\*\* (\d+)/)?.[1] || "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {lintData?.summary?.total_issues === 0 ? (
                <>
                  <CheckCircle className="w-8 h-8 text-success" />
                  <div>
                    <div className="text-2xl font-bold text-success">CLEAN</div>
                    <p className="text-xs text-muted-foreground">0 issues</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-destructive" />
                  <div>
                    <div className="text-2xl font-bold">{lintData?.summary?.total_issues || 0}</div>
                    <p className="text-xs text-muted-foreground">Issues found</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{result?.duration_seconds?.toFixed(2) || "0.00"}s</div>
            <p className="text-xs text-muted-foreground mt-2">Pipeline runtime</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="synthesis" className="w-full">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="synthesis">
            <Code className="w-4 h-4 mr-2" />
            Synthesis Report
          </TabsTrigger>
          <TabsTrigger value="style">
            <FileText className="w-4 h-4 mr-2" />
            Style Review
          </TabsTrigger>
          <TabsTrigger value="lint">Lint Report</TabsTrigger>
          <TabsTrigger value="agents">Agent Details</TabsTrigger>
        </TabsList>

        {/* Synthesis Report Tab */}
        <TabsContent value="synthesis" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Yosys Synthesis Output</CardTitle>
                  <CardDescription>Complete synthesis log from Yosys</CardDescription>
                </div>
                {runId && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDownloadUrl(runId, "synthesis_report.txt")} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {synthesisWarnings.length > 0 && (
                <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-md">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Synthesis Warnings ({synthesisWarnings.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {synthesisWarnings.slice(0, 5).map((warning, i) => (
                      <li key={i} className="font-mono text-xs">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {synthesisReport ? (
                <div className="bg-muted/30 rounded-md p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {synthesisReport.content}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No synthesis report available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Review Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Style & Best Practices Review</CardTitle>
                  <CardDescription>Code quality analysis from A5 agent</CardDescription>
                </div>
                {runId && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDownloadUrl(runId, "style_review.md")} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {styleReview ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <Streamdown>{styleReview.content}</Streamdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No style review available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lint Report Tab */}
        <TabsContent value="lint" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Verilator Lint Report</CardTitle>
                  <CardDescription>Static analysis results from A4 agent</CardDescription>
                </div>
                {runId && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getDownloadUrl(runId, "lint_report.json")} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {lintData ? (
                <div className="space-y-4">
                  {lintData.summary.total_issues === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success" />
                      <h3 className="text-xl font-semibold mb-2">Clean Lint</h3>
                      <p className="text-muted-foreground">
                        No issues detected by Verilator
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-destructive/10 p-3 rounded-md">
                          <div className="text-2xl font-bold text-destructive">
                            {lintData.summary.errors || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Errors</div>
                        </div>
                        <div className="bg-warning/10 p-3 rounded-md">
                          <div className="text-2xl font-bold text-warning">
                            {lintData.summary.warnings || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Warnings</div>
                        </div>
                        <div className="bg-accent/10 p-3 rounded-md">
                          <div className="text-2xl font-bold text-accent">
                            {lintData.summary.info || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Info</div>
                        </div>
                        <div className="bg-success/10 p-3 rounded-md">
                          <div className="text-2xl font-bold text-success">
                            {lintData.summary.auto_fixable || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Auto-fixable</div>
                        </div>
                      </div>

                      {lintData.issues?.length > 0 && (
                        <div className="space-y-2">
                          {lintData.issues.map((issue: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 border border-border rounded-md bg-muted/30"
                            >
                              <div className="flex items-start gap-3">
                                <Badge
                                  className={cn(
                                    "mt-0.5",
                                    issue.severity === "error"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-warning/10 text-warning"
                                  )}
                                >
                                  {issue.severity}
                                </Badge>
                                <div className="flex-1">
                                  <div className="font-medium">{issue.message}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {issue.file}:{issue.line}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No lint report available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Details Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Agent Execution Details</CardTitle>
              <CardDescription>Per-agent metrics and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result?.a1_rtl_generation && (
                  <AgentCard
                    name="A1: RTL Generation"
                    agent={result.a1_rtl_generation}
                    icon={<Code className="w-5 h-5" />}
                  />
                )}
                {result?.a3_constraints && (
                  <AgentCard
                    name="A3: Constraints"
                    agent={result.a3_constraints}
                    icon={<FileText className="w-5 h-5" />}
                  />
                )}
                {result?.a4_lint_cdc && (
                  <AgentCard
                    name="A4: Lint & CDC"
                    agent={result.a4_lint_cdc}
                    icon={<CheckCircle className="w-5 h-5" />}
                  />
                )}
                {result?.a5_style_review && (
                  <AgentCard
                    name="A5: Style Review"
                    agent={result.a5_style_review}
                    icon={<FileText className="w-5 h-5" />}
                  />
                )}
                {result?.a6_synthesis_script && (
                  <AgentCard
                    name="A6: Synthesis Script"
                    agent={result.a6_synthesis_script}
                    icon={<Code className="w-5 h-5" />}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AgentCard({ name, agent, icon }: { name: string; agent: any; icon: React.ReactNode }) {
  return (
    <div className="border border-border rounded-md p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{name}</h4>
            <Badge
              className={cn(
                agent.status === "success"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {agent.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-mono">{agent.duration_seconds?.toFixed(3)}s</span>
            </div>
            {agent.metrics && Object.keys(agent.metrics).length > 0 && (
              <div>
                <span className="text-muted-foreground">Metrics:</span>
                <div className="ml-2 space-y-1">
                  {Object.entries(agent.metrics).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      {key}: <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {agent.errors && agent.errors.length > 0 && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
              <span className="font-semibold">Errors:</span>
              <ul className="list-disc list-inside mt-1">
                {agent.errors.map((error: string, i: number) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border">
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
