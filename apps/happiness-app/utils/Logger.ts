import { create } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

interface LogStore {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, data?: any) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  addLog: (level, message, data) =>
    set((state) => ({
      logs: [
        {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          level,
          message,
          data,
        },
        ...state.logs,
      ].slice(0, 100), // Keep last 100 logs
    })),
  clearLogs: () => set({ logs: [] }),
}));

export const Logger = {
  info: (message: string, data?: any) =>
    useLogStore.getState().addLog('info', message, data),
  warn: (message: string, data?: any) =>
    useLogStore.getState().addLog('warn', message, data),
  error: (message: string, data?: any) =>
    useLogStore.getState().addLog('error', message, data),
  debug: (message: string, data?: any) =>
    useLogStore.getState().addLog('debug', message, data),
};
