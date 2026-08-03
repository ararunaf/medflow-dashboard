/**
 * InMemoryTISSCatalog — store canônico in-process (TISS-02).
 *
 * Implementação oficial do Catalog Store.
 * Sem banco. Sem XML. Sem operadoras. Sem regras.
 */
import type {
  StoredTISSDomain,
  StoredTISSGuideType,
  StoredTISSMetadata,
  StoredTISSProcedureGroup,
  StoredTISSProcedureType,
  StoredTISSProfile,
  StoredTISSReference,
  StoredTISSVersion,
  StoredTISSVocabularyEntry,
  TISSCatalogStore,
} from "./tiss-catalog-store";
import {
  DEFAULT_TISS_CATALOG_ID,
  MINIMAL_TISS_CATALOG_DOMAINS,
  MINIMAL_TISS_CATALOG_GUIDE_TYPES,
  MINIMAL_TISS_CATALOG_METADATA,
  MINIMAL_TISS_CATALOG_PROCEDURE_GROUPS,
  MINIMAL_TISS_CATALOG_PROCEDURE_TYPES,
  MINIMAL_TISS_CATALOG_PROFILES,
  MINIMAL_TISS_CATALOG_REFERENCES,
  MINIMAL_TISS_CATALOG_VERSIONS,
  MINIMAL_TISS_CATALOG_VOCABULARY,
} from "./seed";

export const IN_MEMORY_TISS_CATALOG_STORE_ID = "in-memory-tiss-catalog";

export type InMemoryTISSCatalogOptions = {
  catalogId?: string;
  seedMinimalExamples?: boolean;
  versions?: readonly StoredTISSVersion[];
  guideTypes?: readonly StoredTISSGuideType[];
  procedureTypes?: readonly StoredTISSProcedureType[];
  procedureGroups?: readonly StoredTISSProcedureGroup[];
  domains?: readonly StoredTISSDomain[];
  profiles?: readonly StoredTISSProfile[];
  vocabulary?: readonly StoredTISSVocabularyEntry[];
  references?: readonly StoredTISSReference[];
  metadata?: StoredTISSMetadata;
};

/**
 * Catálogo TISS in-memory — única store canônica da fundação TISS-02.
 */
export class InMemoryTISSCatalog implements TISSCatalogStore {
  readonly storeId = IN_MEMORY_TISS_CATALOG_STORE_ID;
  readonly catalogId: string;

  private metadata: StoredTISSMetadata | undefined;
  private readonly versions = new Map<string, StoredTISSVersion>();
  private readonly guideTypes = new Map<string, StoredTISSGuideType>();
  private readonly procedureTypes = new Map<string, StoredTISSProcedureType>();
  private readonly procedureGroups = new Map<string, StoredTISSProcedureGroup>();
  private readonly domains = new Map<string, StoredTISSDomain>();
  private readonly profiles = new Map<string, StoredTISSProfile>();
  private readonly vocabulary = new Map<string, StoredTISSVocabularyEntry>();
  private readonly references = new Map<string, StoredTISSReference>();

  constructor(options: InMemoryTISSCatalogOptions = {}) {
    this.catalogId = options.catalogId ?? DEFAULT_TISS_CATALOG_ID;
    const seed = options.seedMinimalExamples !== false;

    if (seed) {
      for (const entry of MINIMAL_TISS_CATALOG_VERSIONS) this.setVersion(entry);
      for (const entry of MINIMAL_TISS_CATALOG_GUIDE_TYPES) this.setGuideType(entry);
      for (const entry of MINIMAL_TISS_CATALOG_PROCEDURE_TYPES) this.setProcedureType(entry);
      for (const entry of MINIMAL_TISS_CATALOG_PROCEDURE_GROUPS) this.setProcedureGroup(entry);
      for (const entry of MINIMAL_TISS_CATALOG_DOMAINS) this.setDomain(entry);
      for (const entry of MINIMAL_TISS_CATALOG_PROFILES) this.setProfile(entry);
      for (const entry of MINIMAL_TISS_CATALOG_VOCABULARY) this.setVocabularyEntry(entry);
      for (const entry of MINIMAL_TISS_CATALOG_REFERENCES) this.setReference(entry);
      this.metadata = { ...MINIMAL_TISS_CATALOG_METADATA, catalogId: this.catalogId };
    }

    for (const entry of options.versions ?? []) this.setVersion(entry);
    for (const entry of options.guideTypes ?? []) this.setGuideType(entry);
    for (const entry of options.procedureTypes ?? []) this.setProcedureType(entry);
    for (const entry of options.procedureGroups ?? []) this.setProcedureGroup(entry);
    for (const entry of options.domains ?? []) this.setDomain(entry);
    for (const entry of options.profiles ?? []) this.setProfile(entry);
    for (const entry of options.vocabulary ?? []) this.setVocabularyEntry(entry);
    for (const entry of options.references ?? []) this.setReference(entry);
    if (options.metadata) this.metadata = options.metadata;
  }

  getMetadata(): StoredTISSMetadata | undefined {
    return this.metadata ? { ...this.metadata } : undefined;
  }

  setMetadata(metadata: StoredTISSMetadata): void {
    this.metadata = { ...metadata };
  }

  getVersion(code: string): StoredTISSVersion | undefined {
    const entry = this.versions.get(code);
    return entry ? { ...entry } : undefined;
  }

  setVersion(entry: StoredTISSVersion): void {
    this.versions.set(entry.code, { ...entry });
  }

  listVersions(): readonly StoredTISSVersion[] {
    return Array.from(this.versions.values()).map((entry) => ({ ...entry }));
  }

  getGuideType(code: string): StoredTISSGuideType | undefined {
    const entry = this.guideTypes.get(code);
    return entry ? { ...entry } : undefined;
  }

  setGuideType(entry: StoredTISSGuideType): void {
    this.guideTypes.set(entry.code, { ...entry });
  }

  listGuideTypes(): readonly StoredTISSGuideType[] {
    return Array.from(this.guideTypes.values()).map((entry) => ({ ...entry }));
  }

  getProcedureType(code: string): StoredTISSProcedureType | undefined {
    const entry = this.procedureTypes.get(code);
    return entry ? { ...entry } : undefined;
  }

  setProcedureType(entry: StoredTISSProcedureType): void {
    this.procedureTypes.set(entry.code, { ...entry });
  }

  listProcedureTypes(): readonly StoredTISSProcedureType[] {
    return Array.from(this.procedureTypes.values()).map((entry) => ({ ...entry }));
  }

  getProcedureGroup(code: string): StoredTISSProcedureGroup | undefined {
    const entry = this.procedureGroups.get(code);
    return entry ? { ...entry } : undefined;
  }

  setProcedureGroup(entry: StoredTISSProcedureGroup): void {
    this.procedureGroups.set(entry.code, { ...entry });
  }

  listProcedureGroups(): readonly StoredTISSProcedureGroup[] {
    return Array.from(this.procedureGroups.values()).map((entry) => ({ ...entry }));
  }

  getDomain(code: string): StoredTISSDomain | undefined {
    const entry = this.domains.get(code);
    return entry ? { ...entry } : undefined;
  }

  setDomain(entry: StoredTISSDomain): void {
    this.domains.set(entry.code, { ...entry });
  }

  listDomains(): readonly StoredTISSDomain[] {
    return Array.from(this.domains.values()).map((entry) => ({ ...entry }));
  }

  getProfile(code: string): StoredTISSProfile | undefined {
    const entry = this.profiles.get(code);
    return entry ? { ...entry } : undefined;
  }

  setProfile(entry: StoredTISSProfile): void {
    this.profiles.set(entry.code, { ...entry });
  }

  listProfiles(): readonly StoredTISSProfile[] {
    return Array.from(this.profiles.values()).map((entry) => ({ ...entry }));
  }

  getVocabularyEntry(code: string): StoredTISSVocabularyEntry | undefined {
    const entry = this.vocabulary.get(code);
    return entry ? { ...entry } : undefined;
  }

  setVocabularyEntry(entry: StoredTISSVocabularyEntry): void {
    this.vocabulary.set(entry.code, { ...entry });
  }

  listVocabulary(): readonly StoredTISSVocabularyEntry[] {
    return Array.from(this.vocabulary.values()).map((entry) => ({ ...entry }));
  }

  getReference(id: string): StoredTISSReference | undefined {
    const entry = this.references.get(id);
    return entry ? { ...entry } : undefined;
  }

  setReference(entry: StoredTISSReference): void {
    this.references.set(entry.id, { ...entry });
  }

  listReferences(): readonly StoredTISSReference[] {
    return Array.from(this.references.values()).map((entry) => ({ ...entry }));
  }

  entryCount(): number {
    return (
      this.versions.size +
      this.guideTypes.size +
      this.procedureTypes.size +
      this.procedureGroups.size +
      this.domains.size +
      this.profiles.size +
      this.vocabulary.size +
      this.references.size
    );
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryTISSCatalog ready (${this.entryCount()} entries, catalogId=${this.catalogId}).`,
    };
  }
}
