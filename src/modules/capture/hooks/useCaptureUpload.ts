import { useCallback, useRef, useState } from "react";
import { createCaptureSessionFn } from "@/lib/capture/api/capture-server";
import type { CaptureSessionDetail } from "@/lib/capture/types";
import type { MutationResult } from "@/lib/operations/api";
import { describeError, unwrap } from "@/lib/queries/result";
import {
  uploadCaptureFile,
  retryCaptureUpload,
  cancelCapture,
  getPreviewUrl,
} from "../services/storage-service";
import { createLocalPreviewUrl, fileToBase64, revokeLocalPreviewUrl } from "../utils/file-format";
import type { CapturePhase } from "../types";
import { CapturePhaseMachine, prepareMachineForUpload } from "../services/state-machine";

export function useCaptureUpload(options: {
  onSessionCreated?: (sessionId: string) => void;
  onPhaseChange?: (phase: CapturePhase) => void;
  onPreviewUrl?: (url: string) => void;
  onError?: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [machine] = useState(() => new CapturePhaseMachine());
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // Ref espelha a prévia para o cleanup ser estável: se cleanup dependesse de
  // localPreview, o efeito de desmontagem da página rodaria a cada upload
  // (setLocalPreview no início) e resetaria a máquina no meio do envio.
  const localPreviewRef = useRef<string | null>(null);

  const processFile = useCallback(
    async (file: File, channel: "file_upload" | "mobile_camera", retrySessionId?: string) => {
      setBusy(true);
      options.onError?.(null);

      const blobUrl = createLocalPreviewUrl(file);
      if (localPreviewRef.current) revokeLocalPreviewUrl(localPreviewRef.current);
      localPreviewRef.current = blobUrl;
      setLocalPreview(blobUrl);
      options.onPreviewUrl?.(blobUrl);

      try {
        prepareMachineForUpload(machine, Boolean(retrySessionId));
        options.onPhaseChange?.("uploading");

        let sessionId = retrySessionId;

        if (!sessionId) {
          const createRes = (await createCaptureSessionFn({
            data: { channel },
          })) as MutationResult<{ session: CaptureSessionDetail }>;
          const created = unwrap<{ session: CaptureSessionDetail }>(createRes);
          sessionId = created.session.id;
          options.onSessionCreated?.(sessionId);
        }

        // After create/retry branch, sessionId is always defined for the happy path.
        const activeSessionId = sessionId as string;

        const result = retrySessionId
          ? await retryCaptureUpload(activeSessionId, file)
          : await uploadCaptureFile(activeSessionId, file);

        machine.transition("uploaded", "storage_complete");
        machine.transition("preprocessing", "auto_preprocess");
        machine.transition("waiting_ocr", "ready_for_ocr");

        if (result.status === "OCR_COMPLETED") {
          machine.transition("ocr_completed", "ocr_complete");
          options.onPhaseChange?.("ocr_completed");
        } else {
          options.onPhaseChange?.("waiting_ocr");
        }

        try {
          const remoteUrl = await getPreviewUrl(activeSessionId);
          options.onPreviewUrl?.(remoteUrl);
        } catch {
          // preview remoto opcional se storage ainda propagando
        }

        return { ...result, file, base64: await fileToBase64(file) };
      } catch (err) {
        const message = describeError(err).message;
        try {
          machine.transition("failed", message);
        } catch {
          /* já em failed */
        }
        options.onPhaseChange?.("failed");
        options.onError?.(message);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [machine, options],
  );

  const cancel = useCallback(
    async (sessionId: string) => {
      setBusy(true);
      try {
        await cancelCapture(sessionId);
        machine.transition("cancelled", "user_cancelled");
        options.onPhaseChange?.("cancelled");
      } finally {
        setBusy(false);
      }
    },
    [machine, options],
  );

  const cleanup = useCallback(() => {
    if (localPreviewRef.current) revokeLocalPreviewUrl(localPreviewRef.current);
    localPreviewRef.current = null;
    setLocalPreview(null);
    machine.reset();
  }, [machine]);

  return {
    busy,
    machine,
    localPreview,
    processFile,
    cancel,
    cleanup,
  };
}
