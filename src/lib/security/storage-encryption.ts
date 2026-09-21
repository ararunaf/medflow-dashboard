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
 * Web Crypto (`crypto.subtle`), não `node:crypto` — mesmo padrão já usado
 * em `security-audit-hash.ts` neste projeto. `node:crypto` (createCipheriv/
 * randomBytes) quebra o build do Vite: rotas com `server.handlers` (como
 * `api.capture.report-download.ts`) não recebem a mesma divisão automática
 * client/server que `createServerFn` tem, e o bundler tenta resolver
 * `node:crypto` para o bundle do navegador, onde essas funções não
 * existem. `crypto.subtle`/`crypto.getRandomValues` são globais tanto em
 * Node (desde a v19) quanto no navegador — isomórfico por construção,
 * sem depender de nenhuma divisão de bundle.
 *
 * AES-256-GCM (autenticado — detecta adulteração, não só decodifica).
 * Formato do blob: [marker 1B][iv 12B][ciphertext+authTag (Web Crypto
 * anexa o tag de 16B ao fim do ciphertext automaticamente)].
 * `decryptStorageBytes` devolve blobs sem o marker inalterados (conteúdo
 * legado, já gravado antes desta correção existir) — sem isso, todo dado
 * já em Storage antes de MEDFLOW_STORAGE_ENCRYPTION_KEY existir quebraria.
 */
const IV_LENGTH = 12;
/** Byte que nenhum JSON (`{`/`[`/espaço) ou blob legado começaria por acaso. */
const MARKER = 0xe1;

/** Normaliza para Uint8Array<ArrayBuffer> — crypto.subtle exige BufferSource
 * com buffer concreto; Buffer/subarray/parâmetros genéricos tipam como
 * Uint8Array<ArrayBufferLike>, que o TS não aceita como BufferSource. */
function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes);
}

function decodeKeyBytes(raw: string): Uint8Array<ArrayBuffer> {
  const decoded = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY inválida: precisa decodificar para 32 bytes (256 bits) em hex ou base64.",
    );
  }
  return toArrayBufferView(decoded);
}

async function resolveKey(): Promise<CryptoKey | null> {
  const raw = process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  if (typeof raw !== "string" || raw.length === 0) return null;

  const keyBytes = decodeKeyBytes(raw);
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** true se a chave estiver configurada — usar antes de decidir se pode criptografar. */
export function isStorageEncryptionConfigured(): boolean {
  const raw = process.env.MEDFLOW_STORAGE_ENCRYPTION_KEY;
  return typeof raw === "string" && raw.length > 0;
}

export async function encryptStorageBytes(plaintext: Uint8Array): Promise<Uint8Array> {
  const key = await resolveKey();
  if (!key) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada — upload de conteúdo sensível bloqueado (fail-closed).",
    );
  }
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, toArrayBufferView(plaintext)),
  );

  const out = new Uint8Array(1 + IV_LENGTH + ciphertext.length);
  out[0] = MARKER;
  out.set(iv, 1);
  out.set(ciphertext, 1 + IV_LENGTH);
  return out;
}

export async function decryptStorageBytes(data: Uint8Array): Promise<Uint8Array> {
  if (data.length < 1 + IV_LENGTH || data[0] !== MARKER) {
    // Sem o marker: blob legado gravado antes desta correção — devolve como está.
    return data;
  }
  const key = await resolveKey();
  if (!key) {
    throw new Error(
      "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada — não é possível descriptografar conteúdo existente.",
    );
  }
  const iv = toArrayBufferView(data.subarray(1, 1 + IV_LENGTH));
  const ciphertext = toArrayBufferView(data.subarray(1 + IV_LENGTH));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}
