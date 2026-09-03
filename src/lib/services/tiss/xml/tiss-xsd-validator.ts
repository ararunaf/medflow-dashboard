/**
 * Validação real contra o XSD oficial ANS (padrão TISS 4.01.00) — F3-S2.
 *
 * Usa libxml2-wasm (WebAssembly, sem dependência nativa — roda igual em
 * Node e no runtime Cloudflare Workers do deploy real deste app) para
 * compilar o XSD de verdade e validar o XML gerado contra ele — não é uma
 * checagem estrutural aproximada, é o mesmo compilador de schema (libxml2)
 * usado por ferramentas de validação TISS de mercado.
 *
 * O XSD real usa <include>/<import> entre 6 arquivos (ver schemas/README.md).
 * Sem filesystem real disponível no Workers, a resolução desses includes é
 * feita por um provedor de I/O virtual em memória (virtualXsdInputProvider)
 * — nunca por leitura de disco em tempo de execução. Quem carrega o
 * conteúdo dos 6 arquivos (via import ?raw no app real, via node:fs nos
 * testes/CLI) fica fora deste módulo — ver schemas/load-xsd-files.*.ts.
 */
import {
  XmlDocument,
  XsdValidator,
  xmlRegisterInputProvider,
  type XmlInputProvider,
} from "libxml2-wasm";

const VIRTUAL_SCHEME = "tiss-xsd://";
export const TISS_XSD_ENTRY_POINT = "tissV4_01_00.xsd";

function basename(filename: string): string {
  const noScheme = filename.startsWith(VIRTUAL_SCHEME) ? filename.slice(VIRTUAL_SCHEME.length) : filename;
  const parts = noScheme.split(/[/\\]/);
  return parts[parts.length - 1] ?? noScheme;
}

type VirtualHandle = { bytes: Uint8Array; offset: number };

function createVirtualXsdInputProvider(files: Readonly<Record<string, string>>): XmlInputProvider {
  let nextHandle = 1;
  const openHandles = new Map<number, VirtualHandle>();

  return {
    match(filename) {
      return basename(filename) in files;
    },
    open(filename) {
      const content = files[basename(filename)];
      if (content === undefined) return undefined;
      const handle = nextHandle++;
      openHandles.set(handle, { bytes: new TextEncoder().encode(content), offset: 0 });
      return handle;
    },
    read(fd, buf) {
      const h = openHandles.get(fd);
      if (!h) return -1;
      const remaining = h.bytes.length - h.offset;
      const toCopy = Math.min(remaining, buf.byteLength);
      if (toCopy <= 0) return 0;
      buf.set(h.bytes.subarray(h.offset, h.offset + toCopy));
      h.offset += toCopy;
      return toCopy;
    },
    close(fd) {
      return openHandles.delete(fd);
    },
  };
}

export type TissXsdValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export class TissXsdValidator {
  private readonly validator: XsdValidator;

  private constructor(validator: XsdValidator) {
    this.validator = validator;
  }

  static fromFiles(files: Readonly<Record<string, string>>): TissXsdValidator {
    const entry = files[TISS_XSD_ENTRY_POINT];
    if (!entry) {
      throw new Error(`Arquivo de entrada do XSD ausente: ${TISS_XSD_ENTRY_POINT}.`);
    }
    xmlRegisterInputProvider(createVirtualXsdInputProvider(files));
    const xsdDoc = XmlDocument.fromString(entry, { url: `${VIRTUAL_SCHEME}${TISS_XSD_ENTRY_POINT}` });
    try {
      return new TissXsdValidator(XsdValidator.fromDoc(xsdDoc));
    } finally {
      xsdDoc.dispose();
    }
  }

  validate(xml: string): TissXsdValidationResult {
    const doc = XmlDocument.fromString(xml);
    try {
      this.validator.validate(doc);
      return { valid: true };
    } catch (err) {
      const details = (err as { details?: Array<{ message: string; file?: string; line: number }> }).details;
      const errors = details
        ? details.map((d) => `${d.file ?? "mensagemTISS"}:${d.line}: ${d.message.trim()}`)
        : [err instanceof Error ? err.message : String(err)];
      return { valid: false, errors };
    } finally {
      doc.dispose();
    }
  }
}
