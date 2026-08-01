/**
 * Seleção determinística de Provider — EPC-16 (runtime puro).
 *
 * Aplica FIRST_AVAILABLE estruturalmente via AIProviderRegistry (EPC-07).
 * NÃO invoca IA. NÃO chama HTTP. NÃO usa AIProviderPort.invoke().
 *
 * Políticas além de FIRST_AVAILABLE são registradas no resultado
 * (executionPolicy) mas resolvidas pela mesma trilha determinística na fundação.
 */
import type { AIProviderId, AIProviderRegistration, AIProviderRegistry } from "../../ai-provider";
import { createOrchestrationRequestId } from "../ports/identity";
import type { AISelectionPolicy } from "../ports/policies";
import type { AIOrchestrationRequest, AIOrchestrationResult } from "../ports/types";

function matchesCapabilities(
  registration: AIProviderRegistration,
  requested: readonly string[] | undefined,
): boolean {
  if (!requested || requested.length === 0) return true;
  return requested.every((cap) => (registration.capabilities as readonly string[]).includes(cap));
}

function isSelectable(registration: AIProviderRegistration): boolean {
  return registration.status === "ready" || registration.status === "stub";
}

function orderedCandidates(
  registry: AIProviderRegistry,
  request: AIOrchestrationRequest,
): AIProviderRegistration[] {
  const seen = new Set<AIProviderId>();
  const ordered: AIProviderRegistration[] = [];

  const pushIf = (providerId: AIProviderId) => {
    if (seen.has(providerId)) return;
    const entry = registry.get(providerId);
    if (!entry || !isSelectable(entry)) return;
    if (!matchesCapabilities(entry, request.requestedCapabilities)) return;
    seen.add(providerId);
    ordered.push(entry);
  };

  for (const id of request.preferredProviders ?? []) {
    pushIf(id);
  }
  for (const id of request.fallbackProviders ?? []) {
    pushIf(id);
  }

  // Prefer ready before stub for remaining registry entries.
  const remaining = registry
    .list()
    .filter((entry) => !seen.has(entry.providerId) && isSelectable(entry))
    .filter((entry) => matchesCapabilities(entry, request.requestedCapabilities))
    .sort((a, b) => {
      if (a.status === b.status) return a.providerId.localeCompare(b.providerId);
      if (a.status === "ready") return -1;
      if (b.status === "ready") return 1;
      return a.providerId.localeCompare(b.providerId);
    });

  for (const entry of remaining) {
    seen.add(entry.providerId);
    ordered.push(entry);
  }

  return ordered;
}

function resolvePolicy(request: AIOrchestrationRequest): AISelectionPolicy {
  return request.selectionPolicy ?? "FIRST_AVAILABLE";
}

function matchedCapabilities(
  registration: AIProviderRegistration,
  requested: readonly string[] | undefined,
): readonly string[] {
  if (!requested || requested.length === 0) {
    return [...registration.capabilities];
  }
  return requested.filter((cap) => (registration.capabilities as readonly string[]).includes(cap));
}

/**
 * Seleciona Provider de forma determinística (FIRST_AVAILABLE).
 * Retorna resultado canônico sem execução.
 */
export function selectProviderDeterministic(
  registry: AIProviderRegistry,
  request: AIOrchestrationRequest,
  createId: () => string = createOrchestrationRequestId,
): AIOrchestrationResult {
  const requestId = request.requestId ?? createId();
  const policy = resolvePolicy(request);
  const candidates = orderedCandidates(registry, request);

  if (candidates.length === 0) {
    return {
      ok: false,
      requestId,
      executionPolicy: policy,
      metadataReference: request.metadataReference,
      selectionReason: "no_available_provider",
      message: "Nenhum Provider disponível no AI Provider Registry para a solicitação.",
      code: "no_provider",
    };
  }

  const selected = candidates[0]!;
  const capsMatched = matchedCapabilities(selected, request.requestedCapabilities);

  const reasonParts = [
    "first_available",
    `provider=${selected.providerId}`,
    `status=${selected.status}`,
  ];
  if (policy !== "FIRST_AVAILABLE") {
    reasonParts.push(`requested_policy=${policy}`, "foundation_resolves_as_first_available");
  }

  return {
    ok: true,
    requestId,
    selectedProvider: selected.providerId,
    selectionReason: reasonParts.join("; "),
    capabilitiesMatched: capsMatched as AIOrchestrationResult["capabilitiesMatched"],
    executionPolicy: policy,
    metadataReference: request.metadataReference,
    message: "Provider selected (no AI execution — EPC-16).",
    code: "selected",
  };
}
