import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Play, Pause, Square, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PpaMetrics {
  fmax: number;
  fmaxTarget: number;
  area: number;
  areaTarget: number;
  power: number;
  powerTarget: number;
}

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "warning" | "success" | "decision";
}

export default function AgentFlow() {
  const [isRunning, setIsRunning] = useState(false);
  const [primaryObjective, setPrimaryObjective] = useState("performance");
  const [agentStrategy, setAgentStrategy] = useState("balanced");
  const [ppaMetrics, setPpaMetrics] = useState<PpaMetrics>({
    fmax: 2.45,
    fmaxTarget: 2.5,
    area: 4.9,
    areaTarget: 5.0,
    power: 1.3,
    powerTarget: 1.2,
  });
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      timestamp: "10:30:05",
      message: "Agent: Initializing Design Space Exploration (DSE) with 12 parallel runs.",
      type: "info",
    },
    {
      timestamp: "10:31:40",
      message: "Agent: Run #3 failed timing. Analyzing root cause: High fanout on clock net.",
      type: "warning",
    },
    {
      timestamp: "10:32:15",
      message: "Agent: **Decision:** Increased buffer size on critical net 'ctrl_reg_a'. Re-running placement.",
      type: "decision",
    },
    {
      timestamp: "10:45:00",
      message: "Agent: Run #7 achieved WNS = +10ps. **New Best Result.** Saving model.",
      type: "success",
    },
  ]);
  const [flowProgress, setFlowProgress] = useState(35);

  // Simulate agent activity
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setFlowProgress((prev) => {
        if (prev >= 100) {
          setIsRunning(false);
          return 100;
        }
        return prev + Math.random() * 5;
      });

      // Randomly add log entries
      if (Math.random() > 0.7) {
        const messages = [
          "Agent: Optimizing timing paths...",
          "Agent: Adjusting clock tree structure...",
          "Agent: Evaluating power vs. performance trade-offs...",
          "Agent: Converging on optimal solution...",
        ];
        const types: Array<"info" | "warning" | "success" | "decision"> = ["info", "success", "decision"];
        setLogEntries((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            message: messages[Math.floor(Math.random() * messages.length)],
            type: types[Math.floor(Math.random() * types.length)],
          },
        ]);
      }

      // Update metrics slightly
      setPpaMetrics((prev) => ({
        ...prev,
        fmax: Math.min(prev.fmax + (Math.random() - 0.4) * 0.05, prev.fmaxTarget),
        power: Math.max(prev.power - (Math.random() - 0.3) * 0.02, 0.8),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const getMetricColor = (current: number, target: number, isMinimize: boolean) => {
    if (isMinimize) {
      if (current <= target) return "text-success";
      if (current <= target * 1.1) return "text-warning";
      return "text-error";
    } else {
      if (current >= target) return "text-success";
      if (current >= target * 0.9) return "text-warning";
      return "text-error";
    }
  };

  const getMetricBgColor = (current: number, target: number, isMinimize: boolean) => {
    if (isMinimize) {
      if (current <= target) return "bg-[rgba(52,199,89,0.1)]";
      if (current <= target * 1.1) return "bg-[rgba(255,149,0,0.1)]";
      return "bg-[rgba(255,59,48,0.1)]";
    } else {
      if (current >= target) return "bg-[rgba(52,199,89,0.1)]";
      if (current >= target * 0.9) return "bg-[rgba(255,149,0,0.1)]";
      return "bg-[rgba(255,59,48,0.1)]";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Column 1: Flow Configuration (25%) */}
      <div className="lg:col-span-1">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Flow Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selector */}
            <div>
              <Label className="text-sm mb-2 block">Project/Block</Label>
              <Select defaultValue="cpu_core_v2">
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpu_core_v2">CPU_Core_v2</SelectItem>
                  <SelectItem value="mem_ctrl_a">Memory_Controller_A</SelectItem>
                  <SelectItem value="gpu_core">GPU_Core</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Input Files */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Input Files</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">RTL Source</Label>
                  <Input
                    placeholder="/rtl/cpu_core.vhd"
                    className="bg-input border-border text-xs"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Constraints (SDC)</Label>
                  <Input
                    placeholder="/constraints/timing.sdc"
                    className="bg-input border-border text-xs"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Verification Spec</Label>
                  <Input
                    placeholder="/spec/coverage.yaml"
                    className="bg-input border-border text-xs"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* AI Goal Setting */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Primary Objective</Label>
              <RadioGroup value={primaryObjective} onValueChange={setPrimaryObjective}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="performance" id="perf" />
                  <Label htmlFor="perf" className="text-sm cursor-pointer">
                    Maximize Performance (Fmax)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="power" id="power" />
                  <Label htmlFor="power" className="text-sm cursor-pointer">
                    Minimize Power
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="area" id="area" />
                  <Label htmlFor="area" className="text-sm cursor-pointer">
                    Minimize Area
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coverage" id="coverage" />
                  <Label htmlFor="coverage" className="text-sm cursor-pointer">
                    Maximize Coverage
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Hard Constraints */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Hard Constraints</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Target Fmax (Min)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={ppaMetrics.fmaxTarget}
                      className="bg-input border-border text-xs"
                      disabled
                    />
                    <span className="text-xs text-muted-foreground">GHz</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Area</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={ppaMetrics.areaTarget}
                      className="bg-input border-border text-xs"
                      disabled
                    />
                    <span className="text-xs text-muted-foreground">mm²</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max Power</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={ppaMetrics.powerTarget}
                      className="bg-input border-border text-xs"
                      disabled
                    />
                    <span className="text-xs text-muted-foreground">W</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Strategy */}
            <div>
              <Label className="text-sm mb-2 block">Agent Strategy</Label>
              <Select value={agentStrategy} onValueChange={setAgentStrategy}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aggressive">Aggressive PPA (High Risk)</SelectItem>
                  <SelectItem value="balanced">Balanced (Default)</SelectItem>
                  <SelectItem value="low-power">Low Power Focus</SelectItem>
                  <SelectItem value="fast">Fastest Convergence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button
                onClick={() => setIsRunning(true)}
                disabled={isRunning}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Agent Run
              </Button>
              <Button
                onClick={() => setIsRunning(false)}
                disabled={!isRunning}
                variant="outline"
                className="w-full border-border"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Agent
              </Button>
              <Button variant="outline" className="w-full border-border">
                <Square className="w-4 h-4 mr-2" />
                Stop & Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column 2: Real-Time Monitor (45%) */}
      <div className="lg:col-span-2 space-y-6">
        {/* PPA Target Gauges */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">PPA Target Gauges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Fmax Gauge */}
              <div className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.fmax, ppaMetrics.fmaxTarget, false))}>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold mb-1", getMetricColor(ppaMetrics.fmax, ppaMetrics.fmaxTarget, false))}>
                    {ppaMetrics.fmax.toFixed(2)} GHz
                  </div>
                  <div className="text-xs text-muted-foreground">Target: {ppaMetrics.fmaxTarget} GHz</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.fmax >= ppaMetrics.fmaxTarget ? "✓ On Target" : "⚠ Below Target"}
                  </div>
                </div>
              </div>

              {/* Area Gauge */}
              <div className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.area, ppaMetrics.areaTarget, true))}>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold mb-1", getMetricColor(ppaMetrics.area, ppaMetrics.areaTarget, true))}>
                    {ppaMetrics.area.toFixed(2)} mm²
                  </div>
                  <div className="text-xs text-muted-foreground">Max: {ppaMetrics.areaTarget} mm²</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.area <= ppaMetrics.areaTarget ? "✓ On Target" : "⚠ Over Target"}
                  </div>
                </div>
              </div>

              {/* Power Gauge */}
              <div className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.power, ppaMetrics.powerTarget, true))}>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold mb-1", getMetricColor(ppaMetrics.power, ppaMetrics.powerTarget, true))}>
                    {ppaMetrics.power.toFixed(2)} W
                  </div>
                  <div className="text-xs text-muted-foreground">Max: {ppaMetrics.powerTarget} W</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.power <= ppaMetrics.powerTarget ? "✓ On Target" : "⚠ Over Target"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Flow Progress */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Design Flow Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RTL → Synthesis → Placement → CTS → Routing → Verification</span>
              <span className="font-mono text-accent">{Math.round(flowProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${flowProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Currently in: <span className="text-accent font-semibold">Placement</span> (Iteration 4/10)
            </div>
          </CardContent>
        </Card>

        {/* Critical Path Viewer */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Critical Path Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Worst Negative Slack (WNS)</span>
                <span className="text-sm font-mono text-error">-150ps</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Critical path: clk → reg_a → logic_block → reg_b → clk
              </div>
            </div>
            <Button variant="outline" className="w-full border-border text-sm">
              View Full Timing Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Agent Log & Chat (30%) */}
      <div className="lg:col-span-1">
        <Card className="border-border h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Agent Log & Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Log Feed */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
              {logEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "text-xs p-3 rounded-lg border",
                    entry.type === "info" && "bg-muted/30 border-border text-foreground",
                    entry.type === "warning" && "bg-[rgba(255,149,0,0.1)] border-[rgba(255,149,0,0.3)] text-warning",
                    entry.type === "success" && "bg-[rgba(52,199,89,0.1)] border-[rgba(52,199,89,0.3)] text-success",
                    entry.type === "decision" && "bg-[rgba(0,122,255,0.1)] border-[rgba(0,122,255,0.3)] text-accent"
                  )}
                >
                  <div className="font-mono text-[10px] text-muted-foreground mb-1">{entry.timestamp}</div>
                  <div className="text-xs leading-relaxed">{entry.message}</div>
                </div>
              ))}
            </div>

            {/* Intervention Prompt */}
            {isRunning && (
              <div className="bg-[rgba(255,149,0,0.1)] border border-[rgba(255,149,0,0.3)] rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-warning mb-1">Intervention Suggested</div>
                    <div className="text-muted-foreground">Agent found two equally optimal solutions. Which metric should be prioritized?</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs border-border flex-1">
                    Power
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-border flex-1">
                    Performance
                  </Button>
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="flex gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs border-border"
                disabled={!isRunning}
              >
                👍 Good
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs border-border"
                disabled={!isRunning}
              >
                👎 Poor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
