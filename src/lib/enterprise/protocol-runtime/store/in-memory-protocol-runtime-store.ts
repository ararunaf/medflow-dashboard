/**
 * InMemoryProtocolRuntimeStore — store in-process oficial (C-07).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem SOAP/REST/gRPC, sem mensageria, sem resolução funcional).
 */
import type { ProtocolStatistics } from "../ports/canonical";
import type {
  ProtocolRuntimeStore,
  StoredProtocolContext,
  StoredProtocolProfile,
  StoredProtocolResolver,
} from "./protocol-runtime-store";

export const IN_MEMORY_PROTOCOL_RUNTIME_STORE_ID = "in-memory-protocol-runtime";

export type InMemoryProtocolRuntimeStoreOptions = {
  profiles?: readonly StoredProtocolProfile[];
  contexts?: readonly StoredProtocolContext[];
  resolvers?: readonly StoredProtocolResolver[];
};

export class InMemoryProtocolRuntimeStore implements ProtocolRuntimeStore {
  readonly storeId = IN_MEMORY_PROTOCOL_RUNTIME_STORE_ID;

  private readonly profiles = new Map<string, StoredProtocolProfile>();
  private readonly contexts = new Map<string, StoredProtocolContext>();
  private readonly resolvers = new Map<string, StoredProtocolResolver>();

  constructor(options: InMemoryProtocolRuntimeStoreOptions = {}) {
    for (const profile of options.profiles ?? []) this.setProfile(profile);
    for (const context of options.contexts ?? []) this.setContext(context);
    for (const resolver of options.resolvers ?? []) this.setResolver(resolver);
  }

  getProfile(profileId: string): StoredProtocolProfile | undefined {
    const profile = this.profiles.get(profileId);
    return profile ? { ...profile } : undefined;
  }

  setProfile(profile: StoredProtocolProfile): void {
    const key = profile.profileId ?? `profile-${this.profiles.size + 1}`;
    this.profiles.set(key, { ...profile, profileId: key });
  }

  listProfiles(): readonly StoredProtocolProfile[] {
    return Array.from(this.profiles.values()).map((profile) => ({ ...profile }));
  }

  profileCount(): number {
    return this.profiles.size;
  }

  getContext(contextId: string): StoredProtocolContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredProtocolContext): void {
    const key = context.contextId ?? context.profileId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredProtocolContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getResolver(resolverId: string): StoredProtocolResolver | undefined {
    const resolver = this.resolvers.get(resolverId);
    return resolver ? { ...resolver } : undefined;
  }

  setResolver(resolver: StoredProtocolResolver): void {
    const key = resolver.resolverId ?? `resolver-${this.resolvers.size + 1}`;
    this.resolvers.set(key, { ...resolver, resolverId: key });
  }

  listResolvers(): readonly StoredProtocolResolver[] {
    return Array.from(this.resolvers.values()).map((resolver) => ({ ...resolver }));
  }

  resolverCount(): number {
    return this.resolvers.size;
  }

  statistics(): ProtocolStatistics {
    const all = this.listProfiles();
    let declared = 0;
    let profiled = 0;
    let capable = 0;
    let pending = 0;
    let resolved = 0;
    let failed = 0;
    let disabled = 0;
    for (const profile of all) {
      if (profile.state === "DECLARED") declared += 1;
      if (profile.state === "PROFILED") profiled += 1;
      if (profile.state === "CAPABLE") capable += 1;
      if (profile.state === "PENDING_RESOLUTION") pending += 1;
      if (profile.state === "RESOLVED") resolved += 1;
      if (profile.state === "FAILED") failed += 1;
      if (profile.state === "DISABLED") disabled += 1;
    }
    return {
      kind: "canonical-protocol-statistics",
      totalProfiles: all.length,
      totalContexts: this.contextCount(),
      totalResolvers: this.resolverCount(),
      declaredCount: declared,
      profiledCount: profiled,
      capableCount: capable,
      pendingResolutionCount: pending,
      resolvedCount: resolved,
      failedCount: failed,
      disabledCount: disabled,
      soapImplementedCount: 0,
      restImplementedCount: 0,
      grpcImplementedCount: 0,
      messagingImplementedCount: 0,
      protocolResolutionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Protocol Runtime store ready (${this.profileCount()} profiles, ${this.contextCount()} contexts, ${this.resolverCount()} resolvers).`,
    };
  }
}
