import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRuns, type PipelineRun, getDownloadUrl } from "@/hooks/useRuns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatDuration = (value?: number) =>
  value != null ? `${value.toFixed(2)}s` : "—";

const formatLines = (value?: number) => (value ?? 0).toLocaleString();

export default function Dashboard() {
  const { data, isLoading, error } = useRuns();
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return (
      <Card className="border-border border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load runs: {message}</p>
        </CardContent>
      </Card>
    );
  }

  const runs = data?.runs || [];
  const total = runs.length;
  const successRuns = useMemo(
    () => runs.filter((r) => r.status === "success" && r.synthesis_success).length,
    [runs]
  );
  const failedRuns = useMemo(
    () => runs.filter((r) => r.status === "error" || !r.synthesis_success).length,
    [runs]
  );
  const avgDuration = useMemo(() => {
    if (total === 0) return 0;
    return runs.reduce((sum, r) => sum + (r.duration_seconds ?? 0), 0) / total;
  }, [runs, total]);
  const totalLines = useMemo(
    () => runs.reduce((sum, r) => sum + (r.rtl_lines ?? 0), 0),
    [runs]
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-2">Pipeline executions</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {total > 0 ? Math.round((successRuns / total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {successRuns} passed, {failedRuns} failed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgDuration.toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground mt-2">Per pipeline run</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">RTL Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLines.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Total lines of code</p>
          </CardContent>
        </Card>
      </div>

      {/* Run History Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Pipeline Runs</CardTitle>
          <CardDescription>History of all RTL generation runs</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No runs yet. Start a pipeline in the Agent & Flow view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Module</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Synthesis</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Duration</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">RTL Lines</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Issues</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Started</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.run_id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{run.module_name}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={cn(
                            "text-xs",
                            run.status === "success"
                              ? "bg-[rgba(52,199,89,0.1)] text-success"
                              : run.status === "error"
                              ? "bg-[rgba(255,59,48,0.1)] text-destructive"
                              : "bg-[rgba(0,122,255,0.1)] text-accent"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {run.status === "success" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : run.status === "error" ? (
                              <XCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {run.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={cn(
                            "text-xs",
                            run.synthesis_success
                              ? "bg-[rgba(52,199,89,0.1)] text-success"
                              : "bg-[rgba(255,149,0,0.1)] text-warning"
                          )}
                        >
                          {run.synthesis_success ? "PASS" : "FAIL"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {formatDuration(run.duration_seconds)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {formatLines(run.rtl_lines)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs">
                          {(run.errors_count ?? 0) > 0 && (
                            <span className="text-destructive font-medium">{run.errors_count}E </span>
                          )}
                          {(run.warnings_count ?? 0) > 0 && (
                            <span className="text-warning font-medium">{run.warnings_count}W</span>
                          )}
                          {(run.errors_count ?? 0) === 0 && (run.warnings_count ?? 0) === 0 && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDateTime(run.start_time)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRun(run)}
                            className="h-7 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Detail Dialog */}
      {selectedRun && (
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Run Details: {selectedRun.module_name}</DialogTitle>
              <DialogDescription>Run ID: {selectedRun.run_id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="ml-2">{selectedRun.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Synthesis:</span>
                  <Badge
                    className={cn(
                      "ml-2",
                      selectedRun.synthesis_success
                        ? "bg-[rgba(52,199,89,0.1)] text-success"
                        : "bg-[rgba(255,149,0,0.1)] text-warning"
                    )}
                  >
                    {selectedRun.synthesis_success ? "PASS" : "FAIL"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-mono">{formatDuration(selectedRun.duration_seconds)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RTL Lines:</span>
                  <span className="ml-2 font-mono">{formatLines(selectedRun.rtl_lines)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="ml-2">{formatDateTime(selectedRun.start_time)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Download Artifacts</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <a
                      href={getDownloadUrl(selectedRun.run_id, `${selectedRun.module_name}.v`)}
                      download
                    >
                      <Download className="w-3 h-3 mr-2" />
                      RTL Code (.v)
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <a href={getDownloadUrl(selectedRun.run_id, "result.json")} download>
                      <Download className="w-3 h-3 mr-2" />
                      Result (JSON)
                    </a>
                  </Button>
                  {selectedRun.synthesis_success && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <a
                          href={getDownloadUrl(selectedRun.run_id, "synthesis_report.txt")}
                          download
                        >
                          <Download className="w-3 h-3 mr-2" />
                          Synthesis Report
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <a href={getDownloadUrl(selectedRun.run_id, `${selectedRun.module_name}.sdc`)} download>
                          <Download className="w-3 h-3 mr-2" />
                          SDC Constraints
                        </a>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <a href={getDownloadUrl(selectedRun.run_id, "style_review.md")} download>
                      <Download className="w-3 h-3 mr-2" />
                      Style Review
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                  >
                    <a href={getDownloadUrl(selectedRun.run_id, "lint_report.json")} download>
                      <Download className="w-3 h-3 mr-2" />
                      Lint Report
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
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
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
