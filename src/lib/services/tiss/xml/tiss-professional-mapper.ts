/**
 * Mapeia professionals.crm (texto livre digitado no cadastro) para
 * numeroConselhoProfissional + UF exigidos por ct_contratadoProfissionalDados
 * — F3-S1 follow-up. Reconhece os formatos comuns (UF-NNNNNN, NNNNNN-UF,
 * NNNNNN/UF, com ou sem espaço); lança erro claro em vez de adivinhar
 * quando o formato não bate.
 */

export type ParsedCrm = {
  numero: string;
  uf: string;
};

export function parseCrmForTiss(crm: string): ParsedCrm {
  const cleaned = crm.trim().toUpperCase();

  const ufFirst = cleaned.match(/^([A-Z]{2})[\s/-]*(\d{1,6})$/);
  if (ufFirst) {
    return { uf: ufFirst[1]!, numero: ufFirst[2]! };
  }

  const numeroFirst = cleaned.match(/^(\d{1,6})[\s/-]*([A-Z]{2})$/);
  if (numeroFirst) {
    return { uf: numeroFirst[2]!, numero: numeroFirst[1]! };
  }

  throw new Error(
    `CRM "${crm}" não pôde ser interpretado (esperado algo como "SP-012345" ou "012345/SP") — corrija o cadastro do profissional antes de exportar.`,
  );
}
