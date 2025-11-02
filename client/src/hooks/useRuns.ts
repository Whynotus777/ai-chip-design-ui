import { useQuery } from "@tanstack/react-query";
import {
  api,
  type RunsListResponse,
  type RunDetailResponse,
  type RunFileResponse,
  type PipelineRunSummary,
} from "@/lib/api";

export type PipelineRun = PipelineRunSummary;

export type RunsResponse = RunsListResponse;

export type RunDetail = RunDetailResponse;

async function fetchRuns(): Promise<RunsResponse> {
  return api.listRuns();
}

async function fetchRunDetail(runId: string): Promise<RunDetail> {
  return api.getRunDetail(runId);
}

async function fetchFileContent(runId: string, filename: string): Promise<RunFileResponse> {
  return api.getRunFile(runId, filename);
}

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: fetchRuns,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useRunDetail(runId: string | null) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => fetchRunDetail(runId!),
    enabled: !!runId,
  });
}

export function useFileContent(runId: string | null, filename: string | null) {
  return useQuery({
    queryKey: ["file", runId, filename],
    queryFn: () => fetchFileContent(runId!, filename!),
    enabled: !!runId && !!filename,
  });
}

export function getDownloadUrl(runId: string, filename: string): string {
  return api.getRunDownloadUrl(runId, filename);
}
