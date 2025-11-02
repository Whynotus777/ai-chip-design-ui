/**
 * API Client for AI Chip Design Backend
 *
 * Connects React UI to FastAPI server (port 8000)
 * FastAPI server wraps PipelineOrchestrator (6-agent system)
 *
 * Architecture:
 *   React UI → api.ts → FastAPI (8000) → PipelineOrchestrator → Agents
 */

import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DesignSpec {
  module_name: string;
  description: string;
  data_width?: number;
  clock_freq?: number;
  parameters?: Record<string, any>;
  intent_type?: string;
}

export interface AgentResult {
  agent_name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  output?: string;
  errors: string[];
  execution_time?: number;
}

export interface PipelineRun {
  run_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  agents: AgentResult[];
  final_rtl?: string;
  synthesis_report?: string;
  duration_seconds?: number;
  rtl_lines?: number;
  errors_count?: number;
  warnings_count?: number;
  synthesis_success?: boolean;
}

export interface PipelineRunSummary {
  run_id: string;
  status: string;
  module_name: string;
  synthesis_success?: boolean;
  duration_seconds?: number;
  start_time?: string | null;
  end_time?: string | null;
  rtl_lines?: number;
  errors_count?: number;
  warnings_count?: number;
}

export interface RunsListResponse {
  runs: PipelineRunSummary[];
  total: number;
}

export interface RunDetailResponse {
  run_id: string;
  result: Record<string, any>;
  spec: Record<string, any> | null;
  files: string[];
}

export interface RunFileResponse {
  filename: string;
  content: string;
  size: number;
  modified: string;
}

export interface LogMessage {
  timestamp: string;
  agent: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  run_id: string;
}

export interface HealthStatus {
  status: string;
  orchestrator: string;
  workspace: string;
  active_runs: number;
  total_runs: number;
  websocket_connections: number;
}

// ============================================================================
// HTTP Client
// ============================================================================

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 300000, // 5 minute timeout for long-running pipelines
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response from ${response.config.url}:`, response.status);
        return response;
      },
      (error) => {
        console.error('[API] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async health(): Promise<HealthStatus> {
    const { data } = await this.client.get<HealthStatus>('/api/health');
    return data;
  }

  // Run pipeline
  async runPipeline(spec: DesignSpec): Promise<PipelineRun> {
    const { data } = await this.client.post<PipelineRun>('/api/pipeline/run', spec);
    return data;
  }

  // Get pipeline status
  async getPipelineStatus(runId: string): Promise<PipelineRun> {
    const { data } = await this.client.get<PipelineRun>(`/api/pipeline/status/${runId}`);
    return data;
  }

  // List all runs
  async listRuns(): Promise<RunsListResponse> {
    const { data } = await this.client.get<RunsListResponse>('/api/runs');
    return data;
  }

  async getRunDetail(runId: string): Promise<RunDetailResponse> {
    const { data } = await this.client.get<RunDetailResponse>(`/api/runs/${runId}`);
    return data;
  }

  async getRunFile(runId: string, filename: string): Promise<RunFileResponse> {
    const { data } = await this.client.get<RunFileResponse>(`/api/runs/${runId}/files/${filename}`);
    return data;
  }

  getRunDownloadUrl(runId: string, filename: string): string {
    const base = (this.client.defaults.baseURL || '').replace(/\/$/, '');
    return `${base}/api/runs/${runId}/download/${filename}`;
  }
}

// ============================================================================
// WebSocket Client
// ============================================================================

export class LogStreamClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private onMessageCallback: (log: LogMessage) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;

  constructor(
    onMessage: (log: LogMessage) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;
  }

  connect() {
    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/api/pipeline/logs`);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to log stream');
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const log: LogMessage = JSON.parse(event.data);
          this.onMessageCallback(log);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.onDisconnectCallback?.();

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// Exports
// ============================================================================

// Singleton instance
export const api = new APIClient();

// Export for custom instances
export { APIClient };
