import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRuns, useRunDetail, type PipelineRun, getDownloadUrl } from "@/hooks/useRuns";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "Unknown";

const safeDuration = (value?: number) => value ?? 0;
const safeLines = (value?: number) => value ?? 0;
const safeCount = (value?: number) => value ?? 0;

export default function RunComparison() {
  const { data: runsData, isLoading } = useRuns();
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);

  const runs = runsData?.runs ?? [];

  // Fetch details for selected runs (for future use)
  useRunDetail(selectedRunIds[0] || null);
  useRunDetail(selectedRunIds[1] || null);

  const handleRunSelect = (runId: string, position: number) => {
    const newSelection = [...selectedRunIds];
    newSelection[position] = runId;
    setSelectedRunIds(newSelection);
  };

  const clearSelection = () => setSelectedRunIds([]);

  if (isLoading) {
    return <ComparisonSkeleton />;
  }

  if (runs.length < 2) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Need at least 2 pipeline runs to enable comparison. Run more pipelines in the Agent & Flow view.
          </p>
        </CardContent>
      </Card>
    );
  }

  const run1 = runs.find((run) => run.run_id === selectedRunIds[0]);
  const run2 = runs.find((run) => run.run_id === selectedRunIds[1]);

  const run1Duration = safeDuration(run1?.duration_seconds);
  const run2Duration = safeDuration(run2?.duration_seconds);
  const run1Lines = safeLines(run1?.rtl_lines);
  const run2Lines = safeLines(run2?.rtl_lines);
  const run1Errors = safeCount(run1?.errors_count);
  const run2Errors = safeCount(run2?.errors_count);
  const run1Warnings = safeCount(run1?.warnings_count);
  const run2Warnings = safeCount(run2?.warnings_count);

  const run1Label = run1 ? `${run1.module_name} - ${formatDate(run1.start_time)}` : "Run 1";
  const run2Label = run2 ? `${run2.module_name} - ${formatDate(run2.start_time)}` : "Run 2";

  return (
    <div className="space-y-6">
      {/* Run Selection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Run Comparison</CardTitle>
          <CardDescription>Select two runs to compare side-by-side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Run 1</label>
              <select
                value={selectedRunIds[0] || ""}
                onChange={(event) => handleRunSelect(event.target.value, 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                <option value="">Select a run...</option>
                {runs.map((run) => (
                  <option key={run.run_id} value={run.run_id}>
                    {run.module_name} - {formatDate(run.start_time)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Run 2</label>
              <select
                value={selectedRunIds[1] || ""}
                onChange={(event) => handleRunSelect(event.target.value, 1)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm"
              >
                <option value="">Select a run...</option>
                {runs
                  .filter((run) => run.run_id !== selectedRunIds[0])
                  .map((run) => (
                    <option key={run.run_id} value={run.run_id}>
                      {run.module_name} - {formatDate(run.start_time)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {selectedRunIds.length > 0 && (
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {run1 && run2 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Metric</th>
                    <th className="text-left py-3 px-4 font-semibold">{run1Label}</th>
                    <th className="text-left py-3 px-4 font-semibold">{run2Label}</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">Status</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          run1.status === "success"
                            ? "bg-[rgba(52,199,89,0.1)] text-success"
                            : run1.status === "error"
                            ? "bg-[rgba(255,59,48,0.1)] text-destructive"
                            : "bg-[rgba(0,122,255,0.1)] text-accent"
                        )}
                      >
                        {run1.status === "success" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : run1.status === "error" ? (
                          <XCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {run1.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          run2.status === "success"
                            ? "bg-[rgba(52,199,89,0.1)] text-success"
                            : run2.status === "error"
                            ? "bg-[rgba(255,59,48,0.1)] text-destructive"
                            : "bg-[rgba(0,122,255,0.1)] text-accent"
                        )}
                      >
                        {run2.status === "success" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : run2.status === "error" ? (
                          <XCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {run2.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">—</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">Synthesis</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          run1.synthesis_success
                            ? "bg-[rgba(52,199,89,0.1)] text-success"
                            : "bg-[rgba(255,149,0,0.1)] text-warning"
                        )}
                      >
                        {run1.synthesis_success ? "PASS" : "FAIL"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={cn(
                          run2.synthesis_success
                            ? "bg-[rgba(52,199,89,0.1)] text-success"
                            : "bg-[rgba(255,149,0,0.1)] text-warning"
                        )}
                      >
                        {run2.synthesis_success ? "PASS" : "FAIL"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">—</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">Duration</td>
                    <td className="py-3 px-4 font-mono">{run1Duration.toFixed(2)}s</td>
                    <td className="py-3 px-4 font-mono">{run2Duration.toFixed(2)}s</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono",
                          run1Duration < run2Duration
                            ? "text-success"
                            : run1Duration > run2Duration
                            ? "text-destructive"
                            : ""
                        )}
                      >
                        {run1Duration < run2Duration ? "↓" : run1Duration > run2Duration ? "↑" : "="}
                        {Math.abs(run1Duration - run2Duration).toFixed(2)}s
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">RTL Lines</td>
                    <td className="py-3 px-4 font-mono">{run1Lines.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{run2Lines.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono",
                          run1Lines < run2Lines
                            ? "text-success"
                            : run1Lines > run2Lines
                            ? "text-warning"
                            : ""
                        )}
                      >
                        {run1Lines < run2Lines ? "↓" : run1Lines > run2Lines ? "↑" : "="}
                        {Math.abs(run1Lines - run2Lines).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">Errors</td>
                    <td className="py-3 px-4">
                      <span className={cn("font-mono", run1Errors > 0 ? "text-destructive" : "text-success")}>
                        {run1Errors}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("font-mono", run2Errors > 0 ? "text-destructive" : "text-success")}>
                        {run2Errors}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono",
                          run1Errors < run2Errors
                            ? "text-success"
                            : run1Errors > run2Errors
                            ? "text-destructive"
                            : ""
                        )}
                      >
                        {run1Errors < run2Errors ? "↓" : run1Errors > run2Errors ? "↑" : "="}
                        {Math.abs(run1Errors - run2Errors)}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">Warnings</td>
                    <td className="py-3 px-4">
                      <span className={cn("font-mono", run1Warnings > 0 ? "text-warning" : "text-success")}>
                        {run1Warnings}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("font-mono", run2Warnings > 0 ? "text-warning" : "text-success")}>
                        {run2Warnings}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "font-mono",
                          run1Warnings < run2Warnings
                            ? "text-success"
                            : run1Warnings > run2Warnings
                            ? "text-warning"
                            : ""
                        )}
                      >
                        {run1Warnings < run2Warnings ? "↓" : run1Warnings > run2Warnings ? "↑" : "="}
                        {Math.abs(run1Warnings - run2Warnings)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild className="justify-start">
                <a href={getDownloadUrl(run1.run_id, "result.json")} download>
                  <Download className="w-3 h-3 mr-2" />
                  Download Run 1 Result
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="justify-start">
                <a href={getDownloadUrl(run2.run_id, "result.json")} download>
                  <Download className="w-3 h-3 mr-2" />
                  Download Run 2 Result
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-6" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
