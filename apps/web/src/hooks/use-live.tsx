import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSummary, queryKeys } from '@/lib/queries';
import { useLiveSocket, type LiveMessage } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';
import type { DashboardSummary, Sensor, Reading } from '@dirly/shared';

interface LiveContextValue {
  summary: DashboardSummary | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refresh: () => void;
  socketOpen: boolean;
  isStale: boolean;
}

const LiveContext = createContext<LiveContextValue | null>(null);

function applyMessage(prev: DashboardSummary | undefined, message: LiveMessage): DashboardSummary | undefined {
  if (!prev) return prev;

  switch (message.type) {
    case 'summary':
      return message.data;
    case 'reading': {
      const reading = message.data as Reading;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sensors: prev.sensors.map((snap) =>
          snap.sensor.id === reading.sensorId
            ? {
                ...snap,
                latest: reading,
                sensor: { ...snap.sensor, lastSeenAt: reading.recordedAt },
              }
            : snap,
        ),
      };
    }
    case 'sensor': {
      const sensor = message.data as Sensor;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        sensors: prev.sensors.map((snap) =>
          snap.sensor.id === sensor.id ? { ...snap, sensor } : snap,
        ),
      };
    }
    case 'alert':
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        activeAlerts: Math.max(0, prev.activeAlerts + (message.data.status === 'ACTIVE' ? 1 : -1)),
      };
    case 'settings':
      return { ...prev, settings: message.data };
  }
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthed = user !== null;

  const summaryQuery = useQuery({
    queryKey: queryKeys.summary,
    queryFn: fetchSummary,
    enabled: isAuthed,
    refetchInterval: (query) => {
      // Tanpa WebSocket: polling sesuai refreshInterval dari settings.
      if (query.state.data && query.state.data.settings.refreshIntervalSec) {
        return query.state.data.settings.refreshIntervalSec * 1000;
      }
      return 5000;
    },
  });

  const { open: socketOpen } = useLiveSocket(isAuthed && !summaryQuery.isFetching, (message) => {
    queryClient.setQueryData<DashboardSummary>(queryKeys.summary, (prev) =>
      applyMessage(prev, message),
    );
    if (message.type === 'alert') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts('ACTIVE') });
    }
    if (message.type === 'sensor') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
    }
  });

  return (
    <LiveContext.Provider
      value={{
        summary: summaryQuery.data ?? null,
        isLoading: summaryQuery.isLoading,
        isError: summaryQuery.isError,
        error: summaryQuery.error,
        refresh: () => void queryClient.invalidateQueries({ queryKey: queryKeys.summary }),
        socketOpen,
        isStale: summaryQuery.isStale,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLive harus dipakai di dalam LiveProvider');
  return ctx;
}