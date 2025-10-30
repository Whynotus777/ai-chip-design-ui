import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockStatus {
  name: string;
  status: "rtl" | "synthesis" | "layout" | "verification" | "complete";
  engineer: string;
  fmax: number;
  area: number;
  power: number;
  coverage: number;
}

const blocks: BlockStatus[] = [
  {
    name: "CPU_Core",
    status: "layout",
    engineer: "Alice Chen",
    fmax: 2.45,
    area: 4.8,
    power: 1.1,
    coverage: 92,
  },
  {
    name: "Memory_Controller",
    status: "verification",
    engineer: "Bob Smith",
    fmax: 1.8,
    area: 2.1,
    power: 0.6,
    coverage: 87,
  },
  {
    name: "GPU_Core",
    status: "synthesis",
    engineer: "Carol White",
    fmax: 2.2,
    area: 6.5,
    power: 1.4,
    coverage: 78,
  },
  {
    name: "Cache_System",
    status: "rtl",
    engineer: "David Lee",
    fmax: 2.1,
    area: 3.2,
    power: 0.8,
    coverage: 65,
  },
];

const statusConfig = {
  rtl: { label: "RTL Design", color: "bg-muted text-muted-foreground" },
  synthesis: { label: "Synthesis", color: "bg-[rgba(0,122,255,0.1)] text-accent" },
  layout: { label: "Layout", color: "bg-[rgba(255,149,0,0.1)] text-warning" },
  verification: { label: "Verification", color: "bg-[rgba(52,199,89,0.1)] text-success" },
  complete: { label: "Complete", color: "bg-[rgba(52,199,89,0.1)] text-success" },
};

export default function Dashboard() {
  const totalBlocks = blocks.length;
  const completeBlocks = blocks.filter((b) => b.status === "complete").length;
  const avgCoverage = Math.round(blocks.reduce((sum, b) => sum + b.coverage, 0) / blocks.length);

  return (
    <div className="space-y-6">
      {/* Project Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall PPA Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">85/100</div>
            <p className="text-xs text-muted-foreground mt-2">↑ 5 points from last run</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Block Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completeBlocks}/{totalBlocks}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{Math.round((completeBlocks / totalBlocks) * 100)}% complete</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCoverage}%</div>
            <p className="text-xs text-muted-foreground mt-2">Functional coverage</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Time to Convergence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.3h</div>
            <p className="text-xs text-muted-foreground mt-2">Est. remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Block Status Matrix */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Block Status Matrix</CardTitle>
          <CardDescription>Real-time status of all design blocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Block</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Engineer</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Fmax (GHz)</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Area (mm²)</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Power (W)</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Coverage (%)</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{block.name}</td>
                    <td className="py-3 px-4">
                      <Badge className={cn("text-xs", statusConfig[block.status].color)}>
                        {statusConfig[block.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{block.engineer}</td>
                    <td className="py-3 px-4 text-center font-mono">{block.fmax.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center font-mono">{block.area.toFixed(1)}</td>
                    <td className="py-3 px-4 text-center font-mono">{block.power.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-accent h-1.5 rounded-full transition-all"
                            style={{ width: `${block.coverage}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{block.coverage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Run History Chart */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Run History (Last 10 Iterations)</CardTitle>
          <CardDescription>PPA metrics evolution over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Fmax Trend */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Fmax (GHz)</span>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +0.15 GHz
                </span>
              </div>
              <div className="h-24 bg-muted/30 rounded-lg p-4 flex items-end gap-1">
                {[2.1, 2.15, 2.18, 2.2, 2.22, 2.25, 2.28, 2.3, 2.35, 2.45].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-accent rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(val / 2.5) * 100}%` }}
                    title={`${val.toFixed(2)} GHz`}
                  />
                ))}
              </div>
            </div>

            {/* Power Trend */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Power (W)</span>
                <span className="text-sm text-success flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />
                  -0.25 W
                </span>
              </div>
              <div className="h-24 bg-muted/30 rounded-lg p-4 flex items-end gap-1">
                {[1.6, 1.55, 1.5, 1.48, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-[rgb(52,199,89)] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(val / 1.8) * 100}%` }}
                    title={`${val.toFixed(2)} W`}
                  />
                ))}
              </div>
            </div>

            {/* Area Trend */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Area (mm²)</span>
                <span className="text-sm text-warning flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +0.5 mm²
                </span>
              </div>
              <div className="h-24 bg-muted/30 rounded-lg p-4 flex items-end gap-1">
                {[4.2, 4.3, 4.4, 4.5, 4.6, 4.65, 4.7, 4.75, 4.8, 4.9].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-[rgb(255,149,0)] rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${(val / 5.5) * 100}%` }}
                    title={`${val.toFixed(2)} mm²`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Utilization */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Resource Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CPU Cores</span>
                <span className="text-sm font-mono text-accent">72/128</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "56%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm font-mono text-accent">245/512 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "48%" }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">EDA Licenses</span>
                <span className="text-sm font-mono text-accent">8/10</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
