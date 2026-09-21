/** Limites operacionais V1 — uploads e payloads leves. */
export const OPERATIONAL_UPLOAD_MAX_BYTES = 750_000;
export const OPERATIONAL_JSON_METADATA_MAX_BYTES = 8_000;
export const OPERATIONAL_MESSAGE_MAX_CHARS = 1_800;
export const OPERATIONAL_STACK_SNIPPET_MAX_CHARS = 1_200;
export const OPERATIONAL_HEARTBEAT_INTERVAL_MS = 5 * 60_000;

/** F6-O2 — metas de escala plena da cooperativa (roadmap Fase 6), usadas
 * para calcular o progresso da rampa de produção contra o volume/faturamento
 * real do mês foco. */
export const PRODUCTION_FULL_SCALE_GUIDES_PER_MONTH = 20_000;
export const PRODUCTION_FULL_SCALE_REVENUE_PER_MONTH_BRL = 30_000_000;
export const PRODUCTION_RAMP_TARGET_PERCENTAGES = [10, 50, 100] as const;
