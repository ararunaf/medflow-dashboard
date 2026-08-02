/**
 * Persistência de learning_records.json e learning_metrics.json.
 * MEDICFLOW-LEARNING-LOOP-01
 *
 * Preserva todos os artefatos anteriores do pipeline (OCR, parser, audit, correction).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import {
  buildEmptyRecordsStore,
  calculateMetricsFromRecords,
  LEARNING_ENGINE_VERSION,
} from "../engine/learning-loop-engine";
import type {
  LearningMetricsStore,
  LearningRecordsStore,
  LearningSummaryMeta,
} from "../types/learning-record";

export const LEARNING_RECORDS_FILENAME = "learning_records.json";
export const LEARNING_METRICS_FILENAME = "learning_metrics.json";

export function buildLearningStorageBasePath(tenantId: string): string {
  return `${tenantId}/learning`;
}

export function buildLearningRecordsStoragePath(tenantId: string): string {
  return `${buildLearningStorageBasePath(tenantId)}/${LEARNING_RECORDS_FILENAME}`;
}

export function buildLearningMetricsStoragePath(tenantId: string): string {
  return `${buildLearningStorageBasePath(tenantId)}/${LEARNING_METRICS_FILENAME}`;
}

async function uploadJson(ctx: ServiceCtx, storagePath: string, payload: unknown): Promise<void> {
  const body = JSON.stringify(payload, null, 2);
  await captureStorageUpload(ctx, {
    key: storagePath,
    body: new TextEncoder().encode(body),
    contentType: "application/json",
    upsert: true,
  });
}

async function downloadJson<T>(ctx: ServiceCtx, storagePath: string): Promise<T | null> {
  const body = await captureStorageDownload(ctx, { key: storagePath });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as T;
}

export async function loadLearningRecords(ctx: ServiceCtx): Promise<LearningRecordsStore> {
  const storagePath = buildLearningRecordsStoragePath(ctx.tenantId);
  const store = await downloadJson<LearningRecordsStore>(ctx, storagePath);
  if (!store) return buildEmptyRecordsStore(ctx.tenantId);
  return store;
}

export async function persistLearningRecords(
  ctx: ServiceCtx,
  store: LearningRecordsStore,
): Promise<{ storagePath: string }> {
  const storagePath = buildLearningRecordsStoragePath(ctx.tenantId);
  await uploadJson(ctx, storagePath, store);
  return { storagePath };
}

export async function loadLearningMetrics(ctx: ServiceCtx): Promise<LearningMetricsStore | null> {
  const storagePath = buildLearningMetricsStoragePath(ctx.tenantId);
  return downloadJson<LearningMetricsStore>(ctx, storagePath);
}

export async function persistLearningMetrics(
  ctx: ServiceCtx,
  metrics: LearningMetricsStore,
): Promise<{ storagePath: string }> {
  const storagePath = buildLearningMetricsStoragePath(ctx.tenantId);
  await uploadJson(ctx, storagePath, metrics);
  return { storagePath };
}

export async function persistLearningArtifacts(
  ctx: ServiceCtx,
  store: LearningRecordsStore,
): Promise<{
  recordsPath: string;
  metricsPath: string;
  metrics: LearningMetricsStore;
}> {
  const metrics = calculateMetricsFromRecords(store);
  const { storagePath: recordsPath } = await persistLearningRecords(ctx, store);
  const { storagePath: metricsPath } = await persistLearningMetrics(ctx, metrics);
  return { recordsPath, metricsPath, metrics };
}

export function buildLearningSummaryFromStore(
  store: LearningRecordsStore,
  recordsPath: string,
  metricsPath: string,
): LearningSummaryMeta {
  const last = store.records[store.records.length - 1];
  return {
    status: "completed",
    totalRecords: store.records.length,
    lastRecordedAt: last?.timestamp,
    recordsPath,
    metricsPath,
  };
}

export function buildLearningSummaryFromMetadata(
  metadata: Record<string, unknown>,
): LearningSummaryMeta | null {
  const learning = metadata.learning as LearningSummaryMeta | undefined;
  if (!learning || typeof learning !== "object") return null;
  return learning;
}

export { LEARNING_ENGINE_VERSION };
