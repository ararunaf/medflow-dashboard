/**
 * TISSCatalogStore — contrato interno do store (TISS-02).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria XML; NÃO conhece operadoras/ANS/regras.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalTISSDomain,
  CanonicalTISSGuideType,
  CanonicalTISSMetadata,
  CanonicalTISSProcedureGroup,
  CanonicalTISSProcedureType,
  CanonicalTISSProfile,
  CanonicalTISSReference,
  CanonicalTISSVersion,
  CanonicalTISSVocabularyEntry,
} from "../ports/canonical";

export type StoredTISSVersion = CanonicalTISSVersion;
export type StoredTISSGuideType = CanonicalTISSGuideType;
export type StoredTISSProcedureType = CanonicalTISSProcedureType;
export type StoredTISSProcedureGroup = CanonicalTISSProcedureGroup;
export type StoredTISSDomain = CanonicalTISSDomain;
export type StoredTISSProfile = CanonicalTISSProfile;
export type StoredTISSVocabularyEntry = CanonicalTISSVocabularyEntry;
export type StoredTISSReference = CanonicalTISSReference;
export type StoredTISSMetadata = CanonicalTISSMetadata;

export interface TISSCatalogStore {
  readonly storeId: string;
  readonly catalogId: string;

  getMetadata(): StoredTISSMetadata | undefined;
  setMetadata(metadata: StoredTISSMetadata): void;

  getVersion(code: string): StoredTISSVersion | undefined;
  setVersion(entry: StoredTISSVersion): void;
  listVersions(): readonly StoredTISSVersion[];

  getGuideType(code: string): StoredTISSGuideType | undefined;
  setGuideType(entry: StoredTISSGuideType): void;
  listGuideTypes(): readonly StoredTISSGuideType[];

  getProcedureType(code: string): StoredTISSProcedureType | undefined;
  setProcedureType(entry: StoredTISSProcedureType): void;
  listProcedureTypes(): readonly StoredTISSProcedureType[];

  getProcedureGroup(code: string): StoredTISSProcedureGroup | undefined;
  setProcedureGroup(entry: StoredTISSProcedureGroup): void;
  listProcedureGroups(): readonly StoredTISSProcedureGroup[];

  getDomain(code: string): StoredTISSDomain | undefined;
  setDomain(entry: StoredTISSDomain): void;
  listDomains(): readonly StoredTISSDomain[];

  getProfile(code: string): StoredTISSProfile | undefined;
  setProfile(entry: StoredTISSProfile): void;
  listProfiles(): readonly StoredTISSProfile[];

  getVocabularyEntry(code: string): StoredTISSVocabularyEntry | undefined;
  setVocabularyEntry(entry: StoredTISSVocabularyEntry): void;
  listVocabulary(): readonly StoredTISSVocabularyEntry[];

  getReference(id: string): StoredTISSReference | undefined;
  setReference(entry: StoredTISSReference): void;
  listReferences(): readonly StoredTISSReference[];

  entryCount(): number;
  health(): { ok: boolean; message?: string };
}
