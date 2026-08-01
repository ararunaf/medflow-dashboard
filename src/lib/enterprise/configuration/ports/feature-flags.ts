/**
 * Feature Flags — infraestrutura preparatória (EPC-03).
 *
 * NÃO avalia flags de produto existentes.
 * NÃO altera Environment Manager, Settings ou Auth.
 * Somente tipagem + helpers genéricos sobre ConfigurationPort.
 */
import type { ConfigurationPort } from "./configuration-port";
import type {
  ConfigurationResolutionContext,
  FeatureFlagDefinition,
  FeatureFlagKey,
  FeatureFlagState,
} from "./types";

/** Prefixo lógico estrutural para chaves de feature flag no Configuration Engine. */
export const FEATURE_FLAG_KEY_PREFIX = "feature-flag.";

/** Converte uma FeatureFlagKey em chave de configuração. */
export function toFeatureFlagConfigurationKey(flagKey: FeatureFlagKey): string {
  return `${FEATURE_FLAG_KEY_PREFIX}${flagKey}`;
}

/**
 * Lê um feature flag via ConfigurationPort (infraestrutura).
 *
 * Ainda NÃO deve ser usado por módulos de produto nesta sprint.
 */
export async function getFeatureFlagState(
  port: ConfigurationPort,
  definition: FeatureFlagDefinition,
  resolutionContext?: ConfigurationResolutionContext,
): Promise<FeatureFlagState> {
  const key = toFeatureFlagConfigurationKey(definition.key);

  // 1) Escopo estrutural `feature` (infraestrutura — sem regras de produto)
  const direct = await port.get({
    key,
    scope: { layer: "feature", id: definition.key },
  });
  if (direct.ok && direct.entry?.value.kind === "boolean") {
    return {
      key: definition.key,
      enabled: direct.entry.value.value,
      resolvedFrom: direct.entry.scope?.layer ?? "feature",
    };
  }

  // 2) Walk hierárquico preparado (User → Module → Tenant → Platform → Default)
  const result = await port.get({
    key,
    resolveHierarchy: true,
    resolutionContext,
  });

  if (result.ok && result.entry?.value.kind === "boolean") {
    return {
      key: definition.key,
      enabled: result.entry.value.value,
      resolvedFrom: result.entry.resolvedFrom ?? result.entry.scope?.layer,
    };
  }

  return {
    key: definition.key,
    enabled: definition.defaultEnabled ?? false,
    resolvedFrom: "definition-default",
  };
}

/**
 * Grava um feature flag via ConfigurationPort (infraestrutura).
 * Sem efeitos em flags legadas do produto.
 */
export async function setFeatureFlagState(
  port: ConfigurationPort,
  flagKey: FeatureFlagKey,
  enabled: boolean,
  scope?: { layer: "feature" | "tenant" | "user" | "module" | "platform"; id?: string },
): Promise<{ ok: boolean; key: FeatureFlagKey; message?: string }> {
  const key = toFeatureFlagConfigurationKey(flagKey);
  const setResult = await port.set({
    key,
    value: { kind: "boolean", value: enabled },
    scope: scope ?? { layer: "feature", id: flagKey },
  });
  return {
    ok: setResult.ok,
    key: flagKey,
    message: setResult.message,
  };
}
