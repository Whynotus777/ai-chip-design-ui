/**
 * React Hook for Real-Time Log Streaming
 *
 * WebSocket-based log streaming from backend agents
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LogStreamClient, LogMessage } from '@/lib/api';

export function useLogStream() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<LogStreamClient | null>(null);

  const handleMessage = useCallback((log: LogMessage) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new LogStreamClient(
        handleMessage,
        handleConnect,
        handleDisconnect
      );
      clientRef.current.connect();
    }
  }, [handleMessage, handleConnect, handleDisconnect]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Auto-connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    logs,
    isConnected,
    connect,
    disconnect,
    clearLogs,
  };
}
