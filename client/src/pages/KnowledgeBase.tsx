import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";

interface Model {
  name: string;
  type: "ppa-optimization" | "verification" | "layout";
  accuracy: number;
  runsUsed: number;
  lastUpdated: string;
}

const models: Model[] = [
  {
    name: "PPA Optimizer v2.1",
    type: "ppa-optimization",
    accuracy: 94,
    runsUsed: 127,
    lastUpdated: "2024-10-28",
  },
  {
    name: "Timing Path Analyzer",
    type: "ppa-optimization",
    accuracy: 91,
    runsUsed: 89,
    lastUpdated: "2024-10-25",
  },
  {
    name: "Coverage Predictor",
    type: "verification",
    accuracy: 87,
    runsUsed: 45,
    lastUpdated: "2024-10-20",
  },
  {
    name: "Placement Optimizer",
    type: "layout",
    accuracy: 89,
    runsUsed: 156,
    lastUpdated: "2024-10-26",
  },
];

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      {/* Model Repository */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>AI Model Repository</CardTitle>
          <CardDescription>Manage learned models from previous design runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {models.map((model, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    <Badge
                      className={
                        model.type === "ppa-optimization"
                          ? "bg-accent text-accent-foreground"
                          : model.type === "verification"
                          ? "bg-success text-success-foreground"
                          : "bg-warning text-warning-foreground"
                      }
                    >
                      {model.type.replace("-", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Accuracy: {model.accuracy}%</span>
                    <span>•</span>
                    <span>Trained on {model.runsUsed} runs</span>
                    <span>•</span>
                    <span>Updated: {model.lastUpdated}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-border">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-border text-error">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Design Constraints Library */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Design Constraints Library</CardTitle>
          <CardDescription>Reusable timing and power constraints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "CPU_Core_Timing.sdc", blocks: 3, lastUsed: "2024-10-28" },
              { name: "Memory_Controller_Constraints.sdc", blocks: 2, lastUsed: "2024-10-27" },
              { name: "GPU_Core_Power.sdc", blocks: 1, lastUsed: "2024-10-26" },
            ].map((constraint, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <h3 className="font-semibold">{constraint.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    Used in {constraint.blocks} blocks • Last used: {constraint.lastUsed}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-border">
                  Use
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Project History</CardTitle>
          <CardDescription>Recent design runs and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Fmax</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Power</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Area</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { project: "CPU_Core_v2", date: "2024-10-28", fmax: 2.45, power: 1.2, area: 4.9, status: "Complete" },
                  { project: "Memory_Controller_A", date: "2024-10-27", fmax: 1.8, power: 0.6, area: 2.1, status: "Complete" },
                  { project: "GPU_Core_v1", date: "2024-10-26", fmax: 2.2, power: 1.4, area: 6.5, status: "In Progress" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.project}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                    <td className="py-3 px-4 text-center font-mono">{row.fmax.toFixed(2)} GHz</td>
                    <td className="py-3 px-4 text-center font-mono">{row.power.toFixed(2)} W</td>
                    <td className="py-3 px-4 text-center font-mono">{row.area.toFixed(1)} mm²</td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={row.status === "Complete" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
