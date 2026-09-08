/**
 * Erro comum a todos os gateways `*ViaEnterprise` do Capture: lançado quando
 * o probe de saúde do composition root (getEnterpriseRuntime()) não responde
 * saudável antes de autorizar a execução. Substitui o padrão anterior de
 * "probe existe mas nunca é aguardado/checado" (achado de auditoria, EPC-24E)
 * por um gate real — mesma correção já aplicada em process-ocr-via-enterprise.ts.
 */
import { DomainError, type DomainErrorDetails } from "@/lib/domain/operations/errors";

export class CaptureEnterpriseRuntimeUnavailableError extends DomainError {
  constructor(gateway: string, details?: DomainErrorDetails) {
    super(
      "internal_error",
      `Enterprise Runtime indisponível para ${gateway} — composition root não respondeu saudável.`,
      details,
    );
    this.name = "CaptureEnterpriseRuntimeUnavailableError";
  }
}
