export {
  buildCaptureEvent,
  appendCaptureEvent,
  eventForDbStatusTransition,
  buildFailedEvent,
} from "@/lib/capture/infrastructure/capture-events";

export function listCaptureEvents(
  metadata: Record<string, unknown>,
): import("../types").CapturePipelineEvent[] {
  if (!Array.isArray(metadata.captureEvents)) return [];
  return metadata.captureEvents as import("../types").CapturePipelineEvent[];
}
