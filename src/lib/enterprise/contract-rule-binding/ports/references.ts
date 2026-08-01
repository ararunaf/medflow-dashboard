/**
 * Helpers de referências opacas — EPC-17.
 *
 * Apenas materializam estruturas de referência.
 * NÃO carregam Contratos, Rule Packs, Metadata ou Configuration.
 * NÃO validam existência do alvo.
 */
import type {
  BindingConfigurationReference,
  BindingMetadataReference,
  ContractReference,
  RulePackReference,
} from "./types";

/** Define uma referência opaca a Contrato (EPC-11). */
export function defineContractReference(partial: ContractReference = {}): ContractReference {
  return { ...partial };
}

/** Define uma referência opaca a Rule Pack (EPC-09). */
export function defineRulePackReference(partial: RulePackReference = {}): RulePackReference {
  return { ...partial };
}

/** Define uma referência opaca a Metadata. */
export function defineBindingMetadataReference(
  partial: BindingMetadataReference = {},
): BindingMetadataReference {
  return { ...partial };
}

/** Define uma referência opaca a Configuration. */
export function defineBindingConfigurationReference(
  partial: BindingConfigurationReference = {},
): BindingConfigurationReference {
  return { ...partial };
}
