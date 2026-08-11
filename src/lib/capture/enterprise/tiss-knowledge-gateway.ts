/**
 * Capture TISS Knowledge Gateway — TISS-CONV-01 / EPC-24A.
 *
 * Fluxo oficial exclusivo:
 *   Capture → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → TISSRuntimePort → TISSCatalogPort → RulePackEnginePort → Base Rule Packs
 *
 * Elimina dual-path: sem TUSS_CATALOG paralelo, sem store direto,
 * sem if/switch de operadora/versão/tenant.
 */
import { BASE_PROCEDURE_AUTHORIZATION_PACK_CODE } from "@/lib/enterprise/rule-pack-engine";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type CaptureTissKnowledgeSnapshot = {
  procedureCodes: ReadonlySet<string>;
  authorizationRequiredCodes: ReadonlySet<string>;
  guideTypeCodes: ReadonlySet<string>;
  versionCode: string;
  versionLabel: string;
  hydratedAt: string;
  source: {
    viaEnterpriseRuntime: true;
    viaTISSRuntimePort: true;
    viaTISSCatalogPort: true;
    viaRulePackEnginePort: true;
  };
};

const DEFAULT_VERSION_CODE = "tiss-4.01.00";

let snapshot: CaptureTissKnowledgeSnapshot | null = null;
let hydratePromise: Promise<CaptureTissKnowledgeSnapshot> | null = null;

function normalizeTussCode(code: string): string {
  return code.replace(/\D/g, "").padStart(8, "0");
}

function buildAuthCodesFromPackFindings(
  findings: ReadonlyArray<{
    matched?: boolean;
    attributes?: Readonly<Record<string, string | number | boolean | null>>;
    catalogCodesResolved?: readonly string[];
  }>,
): Set<string> {
  const codes = new Set<string>();
  for (const finding of findings) {
    if (!finding.matched) continue;
    if (finding.attributes?.requiresAuthorization !== true) continue;
    for (const code of finding.catalogCodesResolved ?? []) {
      if (/^\d+$/.test(code)) {
        codes.add(normalizeTussCode(code));
      }
    }
  }
  return codes;
}

async function hydrateFromEnterprise(): Promise<CaptureTissKnowledgeSnapshot> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const tissRuntime = runtime.getTISSRuntimePort();
  const catalog = runtime.getTISSCatalogPort();
  const rulePackEngine = runtime.getRulePackEnginePort();

  // Aquecimento da cadeia oficial (Runtime → TISS Runtime → Ports).
  const runtimeHealth = await tissRuntime.health();
  if (!runtimeHealth.ok) {
    throw new Error(
      `TISS-CONV-01: TISSRuntimePort unhealthy — Capture não pode carregar conhecimento TISS (${runtimeHealth.message ?? "unknown"}).`,
    );
  }

  const [proceduresResult, guideTypesResult, versionResult, authPackResult] = await Promise.all([
    catalog.listProcedureTypes({ tag: "tuss-procedure", status: "active" }),
    catalog.listGuideTypes({ status: "active" }),
    catalog.getVersion({ code: DEFAULT_VERSION_CODE }),
    rulePackEngine.executePack({ code: BASE_PROCEDURE_AUTHORIZATION_PACK_CODE }),
  ]);

  if (!proceduresResult.ok) {
    throw new Error(
      `TISS-CONV-01: TISSCatalogPort.listProcedureTypes falhou (${proceduresResult.message ?? proceduresResult.code}).`,
    );
  }
  if (!guideTypesResult.ok) {
    throw new Error(
      `TISS-CONV-01: TISSCatalogPort.listGuideTypes falhou (${guideTypesResult.message ?? guideTypesResult.code}).`,
    );
  }
  if (!authPackResult.ok) {
    throw new Error(
      `TISS-CONV-01: RulePackEnginePort.executePack falhou (${authPackResult.message ?? authPackResult.code}).`,
    );
  }

  const procedureCodes = new Set<string>();
  for (const entry of proceduresResult.entries ?? []) {
    if (/^\d+$/.test(entry.code)) {
      procedureCodes.add(normalizeTussCode(entry.code));
    }
  }

  const guideTypeCodes = new Set<string>();
  for (const entry of guideTypesResult.entries ?? []) {
    guideTypeCodes.add(entry.code);
  }

  const versionCode = versionResult.entry?.code ?? DEFAULT_VERSION_CODE;
  const versionLabel =
    versionResult.entry?.versionLabel ??
    versionResult.entry?.name?.replace(/^TISS\s+/i, "") ??
    "4.01.00";

  const authorizationRequiredCodes = buildAuthCodesFromPackFindings(
    authPackResult.result?.findings ?? [],
  );

  // Fallback estrutural: atributos do Catalog (ainda via Port), se o pack não marcar.
  if (authorizationRequiredCodes.size === 0) {
    for (const entry of proceduresResult.entries ?? []) {
      if (entry.customAttributes?.requiresAuthorization === true && /^\d+$/.test(entry.code)) {
        authorizationRequiredCodes.add(normalizeTussCode(entry.code));
      }
    }
  }

  const next: CaptureTissKnowledgeSnapshot = {
    procedureCodes,
    authorizationRequiredCodes,
    guideTypeCodes,
    versionCode,
    versionLabel: versionLabel.startsWith("TISS") ? versionLabel : `TISS ${versionLabel}`,
    hydratedAt: new Date().toISOString(),
    source: {
      viaEnterpriseRuntime: true,
      viaTISSRuntimePort: true,
      viaTISSCatalogPort: true,
      viaRulePackEnginePort: true,
    },
  };

  snapshot = next;
  return next;
}

/**
 * Hidrata o snapshot de conhecimento TISS exclusivamente via Enterprise Foundation.
 * Idempotente e seguro para chamadas concorrentes.
 */
export async function hydrateCaptureTissKnowledgeFromEnterprise(): Promise<CaptureTissKnowledgeSnapshot> {
  if (snapshot) return snapshot;
  if (!hydratePromise) {
    hydratePromise = hydrateFromEnterprise().catch((error) => {
      hydratePromise = null;
      throw error;
    });
  }
  return hydratePromise;
}

/** Garante hidratação — alias semântico para serviços Capture. */
export async function ensureCaptureTissKnowledge(): Promise<CaptureTissKnowledgeSnapshot> {
  return hydrateCaptureTissKnowledgeFromEnterprise();
}

export function isCaptureTissKnowledgeReady(): boolean {
  return snapshot != null;
}

export function getCaptureTissKnowledgeSnapshot(): CaptureTissKnowledgeSnapshot {
  if (!snapshot) {
    throw new Error(
      "TISS-CONV-01: conhecimento TISS não hidratado. Chame ensureCaptureTissKnowledge() antes do uso síncrono.",
    );
  }
  return snapshot;
}

/** Testes — limpa snapshot (ex.: após resetEnterpriseRuntimeForTests). */
export function resetCaptureTissKnowledgeForTests(): void {
  snapshot = null;
  hydratePromise = null;
}

export function isTussInCatalogFromEnterprise(code: string): boolean {
  const normalized = normalizeTussCode(code);
  return getCaptureTissKnowledgeSnapshot().procedureCodes.has(normalized);
}

export function tussRequiresAuthorizationFromEnterprise(code: string): boolean {
  const normalized = normalizeTussCode(code);
  return getCaptureTissKnowledgeSnapshot().authorizationRequiredCodes.has(normalized);
}

export function getEnterpriseTissVersionLabel(): string {
  return getCaptureTissKnowledgeSnapshot().versionLabel;
}

export function isCatalogGuideTypeKnown(catalogGuideTypeCode: string): boolean {
  return getCaptureTissKnowledgeSnapshot().guideTypeCodes.has(catalogGuideTypeCode);
}

/** Converte guide type do produto (`guia_consulta`) para código canônico (`guia-consulta`). */
export function toCatalogGuideTypeCode(captureGuideType: string): string {
  return captureGuideType.replace(/_/g, "-");
}

/** Converte código canônico (`guia-consulta`) para guide type do produto (`guia_consulta`). */
export function toCaptureGuideTypeCode(catalogGuideTypeCode: string): string {
  return catalogGuideTypeCode.replace(/-/g, "_");
}
