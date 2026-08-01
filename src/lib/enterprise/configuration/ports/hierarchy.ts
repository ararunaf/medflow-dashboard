/**
 * Hierarquia e resolução estrutural — EPC-03.
 *
 * Apenas estrutura e helpers genéricos. Sem regras de domínio.
 */
import type {
  ConfigurationLayer,
  ConfigurationResolutionContext,
  ConfigurationResolutionLayer,
  ConfigurationScope,
} from "./types";
import { CONFIGURATION_HIERARCHY, CONFIGURATION_RESOLUTION_ORDER } from "./types";

/** Serializa um escopo em segmento de chave composta (estável e genérico). */
export function scopeToSegment(scope?: ConfigurationScope): string {
  if (!scope) {
    return "application";
  }
  const id = scope.id?.trim();
  return id ? `${scope.layer}:${id}` : scope.layer;
}

/** Compõe a chave lógica armazenada: `<scopeSegment>/<key>`. */
export function composeConfigurationStorageKey(key: string, scope?: ConfigurationScope): string {
  return `${scopeToSegment(scope)}/${key}`;
}

/** Mapeia camada de hierarquia oficial → camada de resolução (quando existir). */
export function layerToResolutionLayer(
  layer: ConfigurationLayer,
): ConfigurationResolutionLayer | null {
  switch (layer) {
    case "user":
      return "user";
    case "module":
      return "module";
    case "tenant":
      return "tenant";
    case "platform":
      return "platform";
    case "application":
      return "default";
    case "environment":
    case "feature":
      return null;
    default: {
      const _exhaustive: never = layer;
      return _exhaustive;
    }
  }
}

/**
 * Monta a sequência de escopos para walk de resolução (prep).
 *
 * Ordem: User → Module → Tenant → Platform → Default (application).
 * Environment / Feature entram como camadas oficiais da hierarquia,
 * mas a ordem de resolução mínima desta sprint segue o exemplo EPC-03.
 */
export function buildResolutionScopes(
  context: ConfigurationResolutionContext = {},
): readonly ConfigurationScope[] {
  const scopes: ConfigurationScope[] = [];

  for (const layer of CONFIGURATION_RESOLUTION_ORDER) {
    switch (layer) {
      case "user":
        scopes.push({ layer: "user", id: context.userId });
        break;
      case "module":
        scopes.push({ layer: "module", id: context.moduleId });
        break;
      case "tenant":
        scopes.push({ layer: "tenant", id: context.tenantId });
        break;
      case "platform":
        scopes.push({ layer: "platform", id: context.platformId });
        break;
      case "default":
        scopes.push({ layer: "application", id: undefined });
        break;
      default: {
        const _exhaustive: never = layer;
        void _exhaustive;
      }
    }
  }

  return scopes;
}

/** Expõe a hierarquia oficial (somente leitura). */
export function getOfficialConfigurationHierarchy(): readonly ConfigurationLayer[] {
  return CONFIGURATION_HIERARCHY;
}

/** Expõe a ordem de resolução preparada (somente leitura). */
export function getConfigurationResolutionOrder(): readonly ConfigurationResolutionLayer[] {
  return CONFIGURATION_RESOLUTION_ORDER;
}
