import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Pause, Play, Square, FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipelineExecution } from "@/hooks/usePipeline";
import { useLogStream } from "@/hooks/useLogStream";
import type { AgentResult, LogMessage } from "@/lib/api";

interface PpaMetrics {
  fmaxTarget: number;
  fmaxAchieved: number | null;
  powerTarget: number;
  powerAchieved: number | null;
  areaTarget: number;
  areaAchieved: number | null;
}

type LogType = "info" | "warning" | "success" | "error" | "stderr";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

interface PipelineResultSummary {
  runId: string;
  status: "success" | "error";
  durationSeconds?: number;
  rtlFile?: string;
  totalLines?: number;
  synthesisSuccess?: boolean;
}

const DEFAULT_SPEC = `SPI Master controller with configurable clock polarity, phase,
and data width (8/16/32-bit). Supports full-duplex operation, programmable clock
divider (divide by 2 to 256), and FIFO buffers (8-deep TX/RX). Includes busy
status flag and interrupt generation on transfer complete.`;

// PRD Templates for common design patterns
const PRD_TEMPLATES = {
  spi_master: {
    name: "SPI Master",
    spec: DEFAULT_SPEC,
    dataWidth: 8,
    clockFreq: 100,
    fifoDepth: 8,
  },
  uart: {
    name: "UART Transceiver",
    spec: `Universal Asynchronous Receiver-Transmitter with configurable baud rate (9600-115200),
8N1 format (8 data bits, no parity, 1 stop bit). Includes 16-deep TX/RX FIFOs,
hardware flow control (RTS/CTS), and status flags for frame error, parity error,
and overrun. Supports interrupt generation on receive complete and transmit empty.`,
    dataWidth: 8,
    clockFreq: 50,
    fifoDepth: 16,
  },
  i2c_master: {
    name: "I2C Master",
    spec: `I2C Master controller supporting standard (100kHz) and fast (400kHz) modes.
Implements 7-bit and 10-bit addressing, clock stretching, and multi-master arbitration.
Includes 8-deep command FIFO, automatic ACK/NACK handling, and interrupt generation
on transfer complete, arbitration lost, and bus error conditions.`,
    dataWidth: 8,
    clockFreq: 100,
    fifoDepth: 8,
  },
  fifo: {
    name: "Async FIFO",
    spec: `Asynchronous FIFO with independent read and write clock domains. Supports parameterized
data width and depth with Gray code pointer synchronization for CDC safety. Includes
full/empty flags, programmable almost-full/almost-empty thresholds, and optional
first-word fall-through mode. Provides data count outputs for both clock domains.`,
    dataWidth: 32,
    clockFreq: 200,
    fifoDepth: 64,
  },
  axi_slave: {
    name: "AXI4-Lite Slave",
    spec: `AXI4-Lite compliant slave interface for register access. Supports 32-bit data and address widths,
configurable number of registers (up to 64), read/write access controls per register,
and interrupt generation on register writes. Includes address decode logic, protocol
checkers for AXI compliance, and optional register default values.`,
    dataWidth: 32,
    clockFreq: 250,
    fifoDepth: 4,
  },
  custom: {
    name: "Custom Design",
    spec: "",
    dataWidth: "",
    clockFreq: 100,
    fifoDepth: 8,
  },
};

const AGENT_SEQUENCE = [
  "A1_RTL",
  "A2_Boilerplate",
  "A3_Constraints",
  "A4_Lint",
  "A5_Style",
  "A6_Scripts",
];

const makeDefaultMetrics = (): PpaMetrics => ({
  fmaxTarget: 2.5,
  fmaxAchieved: null,
  powerTarget: 1.2,
  powerAchieved: null,
  areaTarget: 5.0,
  areaAchieved: null,
});

const LOG_LEVEL_TO_TYPE: Record<LogMessage["level"], LogType> = {
  info: "info",
  warning: "warning",
  error: "error",
  success: "success",
};

const formatAgentLabel = (name: string) => {
  const mapping: Record<string, string> = {
    A1_RTL: "A1 · RTL Generation",
    A2_Boilerplate: "A2 · Boilerplate",
    A3_Constraints: "A3 · Constraints",
    A4_Lint: "A4 · Lint",
    A5_Style: "A5 · Style Review",
    A6_Scripts: "A6 · Scripts",
  };
  return mapping[name] ?? name.replace(/_/g, " ");
};

export default function AgentFlow() {
  const [moduleName, setModuleName] = useState("SPI_MASTER_001");
  const [primaryObjective, setPrimaryObjective] = useState("performance");
  const [agentStrategy, setAgentStrategy] = useState("balanced");
  const [specification, setSpecification] = useState(DEFAULT_SPEC);
  const [dataWidth, setDataWidth] = useState<number | "">("");
  const [clockFrequency, setClockFrequency] = useState<number | "">(100);
  const [fifoDepth, setFifoDepth] = useState<number | "">(8);
  const [prdFile, setPrdFile] = useState<File | null>(null);
  const [prdInputMode, setPrdInputMode] = useState<"text" | "file">("text");
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof PRD_TEMPLATES>("spi_master");
  const [prdPreview, setPrdPreview] = useState<string | null>(null);

  const pipeline = usePipelineExecution();
  const { logs, isConnected, clearLogs } = useLogStream();

  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<PipelineResultSummary | null>(null);
  const [ppaMetrics, setPpaMetrics] = useState<PpaMetrics>(makeDefaultMetrics());
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const canRun = moduleName.trim().length > 0 && specification.trim().length > 0;
  const runId = pipeline.runId;

  const agentStatusMap = useMemo(() => {
    const map = new Map<string, AgentResult["status"]>();
    AGENT_SEQUENCE.forEach((name) => map.set(name, "pending"));
    pipeline.agents.forEach((agent) => {
      map.set(agent.agent_name, agent.status);
    });
    return map;
  }, [pipeline.agents]);

  const completedAgents = useMemo(
    () => AGENT_SEQUENCE.filter((name) => agentStatusMap.get(name) === "success"),
    [agentStatusMap]
  );

  const flowProgress = useMemo(() => {
    if (AGENT_SEQUENCE.length === 0) return 0;
    return (completedAgents.length / AGENT_SEQUENCE.length) * 100;
  }, [completedAgents]);

  const runningAgent = useMemo(
    () => pipeline.agents.find((agent) => agent.status === "running"),
    [pipeline.agents]
  );

  const currentStage = useMemo(() => {
    if (runningAgent) return runningAgent.agent_name;
    if (pipeline.isCompleted) return "Completed";
    if (pipeline.isFailed) return "Error";
    if (pipeline.isExecuting) return "Pending";
    return "Idle";
  }, [pipeline.isCompleted, pipeline.isExecuting, pipeline.isFailed, runningAgent]);

  const currentStageLabel = useMemo(() => formatAgentLabel(currentStage), [currentStage]);

  const logEntries = useMemo<LogEntry[]>(() => {
    if (!runId) return [];
    return logs
      .filter((log) => log.run_id === runId)
      .map((log) => {
        const parsed = new Date(log.timestamp);
        const timestamp = Number.isNaN(parsed.getTime())
          ? log.timestamp
          : parsed.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
        return {
          id: `${log.timestamp}-${log.agent}-${log.message}`,
          timestamp,
          message: `[${log.agent}] ${log.message}`,
          type: LOG_LEVEL_TO_TYPE[log.level] ?? "info",
        };
      });
  }, [logs, runId]);

  useEffect(() => {
    if (pipeline.error) {
      const message = pipeline.error instanceof Error ? pipeline.error.message : String(pipeline.error);
      setPipelineError(message);
    }
  }, [pipeline.error]);

  useEffect(() => {
    if (!pipeline.status || !runId) {
      return;
    }

    if (pipeline.status.status === "completed") {
      const synthesisReport = pipeline.status.synthesis_report ?? "";
      const synthesisSuccess = synthesisReport ? !/error|fail/i.test(synthesisReport) : true;
      const durationSeconds =
        pipeline.status.completed_at && pipeline.status.started_at
          ? (new Date(pipeline.status.completed_at).getTime() -
              new Date(pipeline.status.started_at).getTime()) /
            1000
          : undefined;

      const totalLines = pipeline.status.final_rtl
        ? pipeline.status.final_rtl
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean).length
        : undefined;

      setResultSummary({
        runId,
        status: "success",
        durationSeconds,
        rtlFile: pipeline.status.final_rtl ? `${(activeModule ?? moduleName).toLowerCase()}_rtl.v` : undefined,
        totalLines,
        synthesisSuccess,
      });
      setPipelineError(null);
    } else if (pipeline.status.status === "failed") {
      setResultSummary({
        runId,
        status: "error",
        synthesisSuccess: false,
      });
      setPipelineError((prev) => prev ?? "Pipeline reported a failure. Check backend logs for details.");
    }
  }, [pipeline.status, runId, activeModule, moduleName]);

  const handleRun = useCallback(() => {
    if (!moduleName.trim() || !specification.trim()) {
      setPipelineError("Module name and specification are required.");
      return;
    }

    if (pipeline.isExecuting) {
      return;
    }

    const payload = {
      module_name: moduleName.trim(),
      description: specification.trim(),
      data_width: dataWidth === "" ? undefined : Number(dataWidth),
      clock_freq: clockFrequency === "" ? undefined : Number(clockFrequency),
      parameters: {
        fifo_depth: fifoDepth === "" ? undefined : Math.max(Number(fifoDepth), 2),
        objective: primaryObjective,
        strategy: agentStrategy,
      },
    };

    setPipelineError(null);
    setResultSummary(null);
    setPpaMetrics(makeDefaultMetrics());
    setActiveModule(moduleName.trim());
    clearLogs();
    pipeline.run(payload);
  }, [
    agentStrategy,
    clearLogs,
    dataWidth,
    fifoDepth,
    moduleName,
    pipeline,
    primaryObjective,
    specification,
    clockFrequency,
  ]);

  const handleReset = useCallback(() => {
    setResultSummary(null);
    setPipelineError(null);
    setPpaMetrics(makeDefaultMetrics());
    setActiveModule(null);
    clearLogs();
  }, [clearLogs]);

  const getMetricColor = useCallback((current: number | null, target: number, minimize: boolean) => {
    if (current === null) return "text-muted-foreground";
    if (minimize) {
      if (current <= target) return "text-success";
      if (current <= target * 1.1) return "text-warning";
      return "text-error";
    }
    if (current >= target) return "text-success";
    if (current >= target * 0.9) return "text-warning";
    return "text-error";
  }, []);

const getMetricBgColor = useCallback((current: number | null, target: number, minimize: boolean) => {
    if (current === null) return "bg-muted/40";
    if (minimize) {
      if (current <= target) return "bg-[rgba(52,199,89,0.1)]";
      if (current <= target * 1.1) return "bg-[rgba(255,149,0,0.1)]";
      return "bg-[rgba(255,59,48,0.1)]";
    }
    if (current >= target) return "bg-[rgba(52,199,89,0.1)]";
    if (current >= target * 0.9) return "bg-[rgba(255,149,0,0.1)]";
    return "bg-[rgba(255,59,48,0.1)]";
  }, []);

  const handleTemplateSelect = useCallback((templateKey: keyof typeof PRD_TEMPLATES) => {
    setSelectedTemplate(templateKey);
    const template = PRD_TEMPLATES[templateKey];
    setSpecification(template.spec);
    setDataWidth(typeof template.dataWidth === "number" ? template.dataWidth : "");
    setClockFrequency(typeof template.clockFreq === "number" ? template.clockFreq : "");
    setFifoDepth(typeof template.fifoDepth === "number" ? Math.max(template.fifoDepth, 2) : "");
  }, []);

  const handleFileSelect = useCallback((file: File | null) => {
    setPrdFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPrdPreview(content);
        if (prdInputMode === "file") {
          setSpecification(content);
        }
      };
      reader.readAsText(file);
    } else {
      setPrdPreview(null);
    }
  }, [prdInputMode]);

  const metricsDisplay = useMemo(() => {
    const fallback = "Pending";
    return {
      fmax: ppaMetrics.fmaxAchieved ?? fallback,
      power: ppaMetrics.powerAchieved ?? fallback,
      area: ppaMetrics.areaAchieved ?? fallback,
    };
  }, [ppaMetrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Column 1: Flow Configuration */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Flow Configuration</CardTitle>
            <CardDescription>Define the spec-to-silicon run parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-success animate-pulse" : "bg-muted"
                )}
              />
              <span>{isConnected ? "Backend connected" : "Connecting to backend..."}</span>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Module Name</Label>
              <Input
                value={moduleName}
                onChange={(event) => setModuleName(event.target.value)}
                placeholder="e.g. SPI_MASTER_001"
                className="bg-input border-border text-sm"
              />
            </div>

            {/* PRD Input Mode Section */}
            <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Specification Input</Label>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={prdInputMode === "text" ? "default" : "outline"}
                    onClick={() => setPrdInputMode("text")}
                    className="h-7 px-2 text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Text
                  </Button>
                  <Button
                    size="sm"
                    variant={prdInputMode === "file" ? "default" : "outline"}
                    onClick={() => setPrdInputMode("file")}
                    className="h-7 px-2 text-xs"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    File
                  </Button>
                </div>
              </div>

              {prdInputMode === "text" ? (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Use Template (optional)
                    </Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => handleTemplateSelect(value as keyof typeof PRD_TEMPLATES)}
                    >
                      <SelectTrigger className="bg-input border-border text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRD_TEMPLATES).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Design Specification
                    </Label>
                    <Textarea
                      value={specification}
                      onChange={(event) => setSpecification(event.target.value)}
                      rows={8}
                      className="bg-input border-border text-sm resize-none"
                      placeholder="Describe the design requirements in detail. Include features, interfaces, timing requirements, and constraints."
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tip: Be specific about interfaces, protocols, and performance targets
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Upload PRD Document
                    </Label>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".md,.txt,.pdf,.docx"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          handleFileSelect(file);
                        }}
                        className="bg-input border-border text-sm file:text-sm"
                      />
                      {prdFile && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                          <FileText className="w-4 h-4 text-accent" />
                          <span className="flex-1 truncate">{prdFile.name}</span>
                          <span className="text-muted-foreground">
                            {(prdFile.size / 1024).toFixed(1)} KB
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              handleFileSelect(null);
                            }}
                            className="h-5 w-5 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {prdPreview && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Preview (first 500 chars)
                      </Label>
                      <div className="bg-muted/30 border border-border rounded p-2 max-h-32 overflow-y-auto">
                        <pre className="text-[10px] whitespace-pre-wrap">
                          {prdPreview.slice(0, 500)}
                          {prdPreview.length > 500 && "..."}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Data Width (bits)</Label>
                <Input
                  type="number"
                  min={1}
                  value={dataWidth}
                  onChange={(event) => setDataWidth(event.target.value === "" ? "" : Number(event.target.value))}
                  className="bg-input border-border text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Clock (MHz)</Label>
                <Input
                  type="number"
                  min={1}
                  value={clockFrequency}
                  onChange={(event) => setClockFrequency(event.target.value === "" ? "" : Number(event.target.value))}
                  className="bg-input border-border text-sm"
                />
              </div>
              <div>
              <Label className="text-xs text-muted-foreground">FIFO Depth</Label>
              <Input
                type="number"
                min={2}
                value={fifoDepth}
                onChange={(event) => setFifoDepth(event.target.value === "" ? "" : Number(event.target.value))}
                className="bg-input border-border text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Minimum depth is 2 to ensure valid FIFO generation.</p>
            </div>
            </div>

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

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleRun}
                disabled={!canRun || pipeline.isExecuting || !isConnected}
                className="w-full bg-accent text-accent-foreground"
              >
                {pipeline.isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Agent Run
                  </>
                )}
              </Button>
              <Button disabled variant="outline" className="w-full border-border">
                <Pause className="w-4 h-4 mr-2" />
                Pause Agent
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full border-border">
                <Square className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {pipelineError && (
              <div className="bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.3)] rounded-lg p-3 text-sm text-error">
                {pipelineError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Column 2: Real-Time Monitor */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Pipeline Status</CardTitle>
            <CardDescription>
              {pipeline.isExecuting
                ? "Pipeline execution in progress"
                : pipeline.isCompleted
                ? "Last run completed — ready for another"
                : "Ready to launch a new run"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.fmaxAchieved, ppaMetrics.fmaxTarget, false))}>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-2xl font-bold mb-1",
                      getMetricColor(ppaMetrics.fmaxAchieved, ppaMetrics.fmaxTarget, false)
                    )}
                  >
                    {metricsDisplay.fmax === "Pending" ? "Pending" : `${metricsDisplay.fmax} GHz`}
                  </div>
                  <div className="text-xs text-muted-foreground">Target: {ppaMetrics.fmaxTarget.toFixed(2)} GHz</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.fmaxAchieved !== null && ppaMetrics.fmaxAchieved >= ppaMetrics.fmaxTarget
                      ? "✓ On Target"
                      : "Awaiting results"}
                  </div>
                </div>
              </div>

              <div className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.areaAchieved, ppaMetrics.areaTarget, true))}>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-2xl font-bold mb-1",
                      getMetricColor(ppaMetrics.areaAchieved, ppaMetrics.areaTarget, true)
                    )}
                  >
                    {typeof metricsDisplay.area === "number"
                      ? `${metricsDisplay.area.toFixed(2)} mm²`
                      : "Pending"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max: {ppaMetrics.areaTarget.toFixed(2)} mm²</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.areaAchieved !== null && ppaMetrics.areaAchieved <= ppaMetrics.areaTarget
                      ? "✓ On Target"
                      : "Awaiting results"}
                  </div>
                </div>
              </div>

              <div
                className={cn("p-4 rounded-lg", getMetricBgColor(ppaMetrics.powerAchieved, ppaMetrics.powerTarget, true))}
              >
                <div className="text-center">
                  <div
                    className={cn(
                      "text-2xl font-bold mb-1",
                      getMetricColor(ppaMetrics.powerAchieved, ppaMetrics.powerTarget, true)
                    )}
                  >
                    {typeof metricsDisplay.power === "number"
                      ? `${metricsDisplay.power.toFixed(2)} W`
                      : "Pending"}
                  </div>
                  <div className="text-xs text-muted-foreground">Max: {ppaMetrics.powerTarget.toFixed(2)} W</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {ppaMetrics.powerAchieved !== null && ppaMetrics.powerAchieved <= ppaMetrics.powerTarget
                      ? "✓ On Target"
                      : "Awaiting results"}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current Stage</span>
                <span className="font-medium">{currentStageLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Job ID</span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[240px]">
                  {runId ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Design Flow Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">RTL → Style → Lint → Constraints → Synthesis</span>
              <span className="font-mono text-accent">{Math.round(flowProgress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${flowProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {pipeline.isExecuting
                ? `Active stage: ${currentStageLabel}`
                : resultSummary
                ? `Last run completed in ${resultSummary.durationSeconds?.toFixed(1) ?? "—"}s`
                : "Ready for next run"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Pipeline Output Summary</CardTitle>
            <CardDescription>Artifacts become available once the pipeline completes</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {resultSummary ? (
              <>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={resultSummary.status === "success" ? "text-success" : "text-error"}>
                    {resultSummary.status === "success" ? "Success" : "Failed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lines Generated</span>
                  <span className="font-mono">{resultSummary.totalLines ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Synthesis</span>
                  <span className={resultSummary.synthesisSuccess ? "text-success" : "text-warning"}>
                    {resultSummary.synthesisSuccess ? "PASS" : "CHECK LOG"}
                  </span>
                </div>
                {resultSummary.rtlFile && (
                  <div className="flex justify-between">
                    <span>RTL File</span>
                    <span className="font-mono text-xs">{resultSummary.rtlFile}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">Run the pipeline to see generated artifacts.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Column 3: Agent Log */}
      <div className="lg:col-span-1">
        <Card className="border-border h-full flex flex-col">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Agent Log & Telemetry</CardTitle>
            <CardDescription>Live stream of agent decisions and backend output</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
              {logEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Launch the pipeline to view real-time log output from the A1→A6 flow.
                </div>
              ) : (
                logEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "text-xs p-3 rounded-lg border",
                      entry.type === "info" && "bg-muted/30 border-border text-foreground",
                      entry.type === "warning" && "bg-[rgba(255,149,0,0.1)] border-[rgba(255,149,0,0.3)] text-warning",
                      entry.type === "success" && "bg-[rgba(52,199,89,0.1)] border-[rgba(52,199,89,0.3)] text-success",
                      entry.type === "error" && "bg-[rgba(255,59,48,0.1)] border-[rgba(255,59,48,0.3)] text-error",
                      entry.type === "stderr" && "bg-muted/20 border-border text-muted-foreground"
                    )}
                  >
                    <div className="font-mono text-[10px] text-muted-foreground mb-1">{entry.timestamp}</div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap">{entry.message}</div>
                  </div>
                ))
              )}
            </div>

            {pipeline.isExecuting && (
              <div className="bg-[rgba(0,122,255,0.08)] border border-[rgba(0,122,255,0.2)] rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-accent mb-1">Pipeline Active</div>
                    <div className="text-muted-foreground">
                      Monitor the live progress stream. You can leave this view and the run will continue.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t border-border pt-3">
              <Button size="sm" variant="outline" className="flex-1 text-xs border-border" disabled>
                👍 Good
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs border-border" disabled>
                👎 Poor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
