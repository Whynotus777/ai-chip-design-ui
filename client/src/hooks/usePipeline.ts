/**
 * React Hook for Pipeline API
 *
 * Provides React Query integration for pipeline operations
 * with automatic state management, caching, and refetching
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, DesignSpec, PipelineRun } from '@/lib/api';

// ============================================================================
// Query Keys
// ============================================================================

export const pipelineKeys = {
  all: ['pipeline'] as const,
  runs: () => [...pipelineKeys.all, 'runs'] as const,
  run: (id: string) => [...pipelineKeys.all, 'run', id] as const,
  health: () => [...pipelineKeys.all, 'health'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Health check hook
 */
export function useHealth() {
  return useQuery({
    queryKey: pipelineKeys.health(),
    queryFn: () => api.health(),
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

/**
 * List all pipeline runs
 */
export function usePipelineRuns() {
  return useQuery({
    queryKey: pipelineKeys.runs(),
    queryFn: () => api.listRuns(),
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

/**
 * Get specific pipeline run status
 */
export function usePipelineStatus(runId: string | null) {
  return useQuery({
    queryKey: pipelineKeys.run(runId || ''),
    queryFn: () => api.getPipelineStatus(runId!),
    enabled: !!runId, // Only run if runId exists
    refetchInterval: (data) => {
      // Poll every 2 seconds if running, stop if completed/failed
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

/**
 * Run pipeline mutation
 */
export function useRunPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spec: DesignSpec) => api.runPipeline(spec),
    onSuccess: (data) => {
      // Invalidate runs list to show new run
      queryClient.invalidateQueries({ queryKey: pipelineKeys.runs() });

      // Set initial data for this run
      queryClient.setQueryData(pipelineKeys.run(data.run_id), data);
    },
    onError: (error) => {
      console.error('Failed to start pipeline:', error);
    },
  });
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Combined hook for pipeline execution with status polling
 */
export function usePipelineExecution() {
  const runMutation = useRunPipeline();
  const statusQuery = usePipelineStatus(runMutation.data?.run_id || null);

  return {
    // Mutation
    run: runMutation.mutate,
    runAsync: runMutation.mutateAsync,
    isRunning: runMutation.isPending,

    // Current run
    runId: runMutation.data?.run_id,
    status: statusQuery.data,
    isPolling: statusQuery.isFetching,

    // Combined state
    isExecuting: statusQuery.data?.status === 'running',
    isCompleted: statusQuery.data?.status === 'completed',
    isFailed: statusQuery.data?.status === 'failed',

    // Results
    agents: statusQuery.data?.agents || [],
    finalRtl: statusQuery.data?.final_rtl,
    synthesisReport: statusQuery.data?.synthesis_report,

    // Error handling
    error: runMutation.error || statusQuery.error,
  };
}
