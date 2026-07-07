import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCaptureSessionFn,
  getCaptureSessionFn,
  getCaptureSessionStatusFn,
} from "@/lib/capture/api/capture-server";
import type { CaptureSessionStatus } from "@/lib/capture/types";
import { dbStatusToPhase } from "../utils/status-map";
import { listCaptureEvents } from "../services/capture-events";
import type { CapturePhase, CapturePipelineEvent, CaptureSessionView } from "../types";

const INITIAL_VIEW: CaptureSessionView = {
  sessionId: null,
  phase: "idle",
  channel: null,
  file: null,
  previewUrl: null,
  transitions: [],
  statusHistory: [],
  events: [],
  error: null,
};

export function useCaptureSession(sessionId: string | null) {
  const [view, setView] = useState<CaptureSessionView>(INITIAL_VIEW);
  const [status, setStatus] = useState<CaptureSessionStatus | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (id: string) => {
    const res = await getCaptureSessionStatusFn({ data: { sessionId: id } });
    if (!res.ok) {
      setView((v) => ({ ...v, error: res.error.message }));
      return;
    }

    const phase = dbStatusToPhase(res.data.status, res.data.metadata);
    const events = listCaptureEvents(res.data.metadata ?? {});

    setStatus(res.data.status);
    setView((v) => ({
      ...v,
      sessionId: id,
      phase,
      statusHistory: res.data.statusHistory.map((h) => ({
        from: h.from,
        to: h.to,
        at: h.at,
        note: h.note,
      })),
      events,
      error: null,
    }));
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await getCaptureSessionFn({ data: { sessionId: id } });
    if (!res.ok) return;
    const doc = res.data.documents[res.data.documents.length - 1];
    if (doc) {
      setView((v) => ({
        ...v,
        file: {
          name: doc.originalFilename,
          mimeType: doc.mimeType,
          byteLength: doc.byteLength,
          checksumSha256: doc.checksumSha256,
          version: (doc.metadata?.version as number) ?? 1,
        },
        channel: res.data.channel,
      }));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    void refresh(sessionId);
    void loadDetail(sessionId);

    pollingRef.current = setInterval(() => {
      void refresh(sessionId);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId, refresh, loadDetail]);

  const setPhase = useCallback((phase: CapturePhase) => {
    setView((v) => ({ ...v, phase }));
  }, []);

  const setEvents = useCallback((events: CapturePipelineEvent[]) => {
    setView((v) => ({ ...v, events }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setView((v) => ({ ...v, error }));
  }, []);

  const setPreviewUrl = useCallback((previewUrl: string | null) => {
    setView((v) => ({ ...v, previewUrl }));
  }, []);

  const setFile = useCallback((file: CaptureSessionView["file"]) => {
    setView((v) => ({ ...v, file }));
  }, []);

  const reset = useCallback(() => {
    setView(INITIAL_VIEW);
    setStatus(null);
  }, []);

  return {
    view,
    status,
    refresh,
    loadDetail,
    setPhase,
    setEvents,
    setError,
    setPreviewUrl,
    setFile,
    reset,
    createSession: createCaptureSessionFn,
  };
}
