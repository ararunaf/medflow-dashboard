/**
 * Criptografia de conteúdo em repouso para artefatos sensíveis do pipeline
 * de captura (OCR/guia estruturada/auditoria/contrato/risco/correção) —
 * SEC-PII-02.
 *
 * Escopo deliberado: cobre os 6 artefatos JSON derivados do pipeline
 * (onde CPF/nome de paciente ficam em texto pleno hoje — achado da
 * auditoria externa). NÃO cobre o documento original escaneado, que é
 * renderizado como preview inline (`<img>`) na Review UI — criptografá-lo
 * exige trocar esse preview por um fluxo autenticado de fetch+blob, uma
 * mudança de UI maior e fora do escopo desta correção. Registrado como
 * próximo passo separado.
 *
 * AES-256-GCM (autenticado — detecta adulteração, não só decodifica).
 * Formato do blob: [marker 1B][iv 12B][authTag 16B][ciphertext].
 * `decryptStorageBytes` devolve blobs sem o marker inalterados (conteúdo
 * legado, já gravado antes desta correção existir) — sem isso, todo dado
 * já em Storage antes de MEDFLOW_STORAGE_ENCRYPTION_KEY existir quebraria.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
/** Byte que nenhum JSON (`{`/`[`/espaço) ou blob legado começaria por acaso. */
const MARKER = 0xe1;
const HEADER_LENGTH = 1 + IV_LENGTH + AUTH_TAG_LENGTH;

function resolveKey(): Buffer | null {
  const raw = process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  if (typeof raw !== "string" || raw.length === 0) return null;

  const key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY inválida: precisa decodificar para 32 bytes (256 bits) em hex ou base64.",
    );
  }
  return key;
}

/** true se a chave estiver configurada — usar antes de decidir se pode criptografar. */
export function isStorageEncryptionConfigured(): boolean {
  return resolveKey() !== null;
}

export function encryptStorageBytes(plaintext: Uint8Array): Uint8Array {
  const key = resolveKey();
  if (!key) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada — upload de conteúdo sensível bloqueado (fail-closed).",
    );
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from([MARKER]), iv, authTag, ciphertext]);
}

export function decryptStorageBytes(data: Uint8Array): Uint8Array {
  if (data.length < HEADER_LENGTH || data[0] !== MARKER) {
    // Sem o marker: blob legado gravado antes desta correção — devolve como está.
    return data;
  }
  const key = resolveKey();
  if (!key) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada — não é possível descriptografar conteúdo existente.",
    );
  }
  const iv = data.subarray(1, 1 + IV_LENGTH);
  const authTag = data.subarray(1 + IV_LENGTH, HEADER_LENGTH);
  const ciphertext = data.subarray(HEADER_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
