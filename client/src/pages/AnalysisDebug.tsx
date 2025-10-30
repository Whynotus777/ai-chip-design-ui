import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function AnalysisDebug() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="ppa" className="w-full">
        <TabsList className="bg-muted border-border">
          <TabsTrigger value="ppa">PPA Comparison</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Report</TabsTrigger>
          <TabsTrigger value="logs">Log Viewer</TabsTrigger>
        </TabsList>

        {/* PPA Comparison */}
        <TabsContent value="ppa" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Base vs. Best Comparison</CardTitle>
              <CardDescription>Compare your manual run with the AI's best result</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Metric</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Base Run</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Best Run (AI)</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">Fmax (GHz)</td>
                      <td className="py-3 px-4 text-center font-mono">2.30</td>
                      <td className="py-3 px-4 text-center font-mono text-success">2.45</td>
                      <td className="py-3 px-4 text-center font-mono text-success">+6.5%</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">Power (W)</td>
                      <td className="py-3 px-4 text-center font-mono">1.45</td>
                      <td className="py-3 px-4 text-center font-mono text-success">1.20</td>
                      <td className="py-3 px-4 text-center font-mono text-success">-17.2%</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">Area (mm²)</td>
                      <td className="py-3 px-4 text-center font-mono">4.95</td>
                      <td className="py-3 px-4 text-center font-mono text-success">4.90</td>
                      <td className="py-3 px-4 text-center font-mono text-success">-1.0%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">WNS (ps)</td>
                      <td className="py-3 px-4 text-center font-mono text-error">-250</td>
                      <td className="py-3 px-4 text-center font-mono text-success">+10</td>
                      <td className="py-3 px-4 text-center font-mono text-success">+260ps</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Metric Heatmaps</CardTitle>
              <CardDescription>Spatial distribution of timing slack and power density</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 h-48 flex items-center justify-center text-muted-foreground">
                  Timing Slack Heatmap (Interactive)
                </div>
                <div className="bg-muted/30 rounded-lg p-4 h-48 flex items-center justify-center text-muted-foreground">
                  Power Density Heatmap (Interactive)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Report */}
        <TabsContent value="coverage" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Verification Coverage Report</CardTitle>
              <CardDescription>Functional, code, and assertion coverage metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Functional Coverage</span>
                  <span className="text-sm font-mono text-accent">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Code Coverage (Line)</span>
                  <span className="text-sm font-mono text-accent">87%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: "87%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Code Coverage (Toggle)</span>
                  <span className="text-sm font-mono text-warning">78%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-warning h-2 rounded-full" style={{ width: "78%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">FSM Coverage</span>
                  <span className="text-sm font-mono text-success">99%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: "99%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Coverage Hole Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-[rgba(255,149,0,0.1)] border border-[rgba(255,149,0,0.3)] rounded-lg p-3">
                <div className="text-sm font-semibold text-warning mb-1">Missing stimulus for state X in FSM Y</div>
                <div className="text-xs text-muted-foreground">Recommended testcase: transition_x_to_y_edge_case</div>
              </div>
              <div className="bg-[rgba(255,149,0,0.1)] border border-[rgba(255,149,0,0.3)] rounded-lg p-3">
                <div className="text-sm font-semibold text-warning mb-1">Untoggled signal: ctrl_reg[3:0]</div>
                <div className="text-xs text-muted-foreground">Location: cpu_core.rtl:line 245</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Viewer */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Smart Log Viewer</CardTitle>
              <CardDescription>Consolidated logs with AI-identified critical issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="bg-muted/30 p-3 rounded-lg font-mono text-xs text-muted-foreground">
                  [10:30:05] INFO: Starting synthesis flow...
                </div>
                <div className="bg-[rgba(0,122,255,0.1)] p-3 rounded-lg font-mono text-xs text-accent border border-[rgba(0,122,255,0.3)]">
                  [10:31:40] CRITICAL: Timing violation detected on path clk → reg_a
                </div>
                <div className="bg-[rgba(255,149,0,0.1)] p-3 rounded-lg font-mono text-xs text-warning border border-[rgba(255,149,0,0.3)]">
                  [10:32:15] WARNING: High fanout detected on net ctrl_clk (fanout: 245)
                </div>
                <div className="bg-muted/30 p-3 rounded-lg font-mono text-xs text-muted-foreground">
                  [10:45:00] INFO: Placement completed in 15 minutes
                </div>
                <div className="bg-[rgba(52,199,89,0.1)] p-3 rounded-lg font-mono text-xs text-success border border-[rgba(52,199,89,0.3)]">
                  [11:00:30] SUCCESS: All timing constraints met. WNS = +10ps
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 border-border">
                Export Logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
