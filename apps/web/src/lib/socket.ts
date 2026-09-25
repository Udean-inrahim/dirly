import { useEffect, useRef, useState } from 'react';
import { WS_URL } from './config';
import { authStorage } from './api';
import type { DashboardSummary, Reading, Sensor, Alert, Settings } from '@dirly/shared';

export type LiveMessage =
  | { type: 'summary'; data: DashboardSummary }
  | { type: 'reading'; data: Reading }
  | { type: 'sensor'; data: Sensor }
  | { type: 'alert'; data: Alert }
  | { type: 'settings'; data: Settings };

const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 15000;

export function useLiveSocket(
  enabled: boolean,
  onMessage: (message: LiveMessage) => void,
): { open: boolean } {
  const [open, setOpen] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      return;
    }

    let ws: WebSocket | null = null;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed || !enabledRef.current) return;
      const token = authStorage.token;
      const url = `${WS_URL}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        retry = 0;
        setOpen(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as LiveMessage;
          onMessageRef.current(message);
        } catch {
          // abai pesan yang bukan JSON
        }
      };

      ws.onclose = () => {
        setOpen(false);
        if (closed) return;
        retryTimer = setTimeout(connect, Math.min(RETRY_BASE_MS * 2 ** retry, RETRY_MAX_MS));
        retry += 1;
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [enabled]);

  return { open };
}