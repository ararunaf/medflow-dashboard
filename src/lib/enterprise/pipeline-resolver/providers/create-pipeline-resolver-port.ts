/**
 * Provider / factory do PipelineResolverPort — inversão de dependência (EPC-24 Sprint 02).
 *
 * Application resolve o Port via este factory; nunca instancia adapters
 * diretamente no Domain.
 *
 * Default: DefaultPipelineResolverAdapter.
 */
import { createPipelineResolverFactory } from "../factory/pipeline-resolver-factory";
import type { PipelineResolverPort } from "../ports/pipeline-resolver-port";
import type { PipelineResolverProviderOptions } from "../ports/types";

/**
 * Cria o PipelineResolverPort para o mecanismo solicitado.
 *
 * Default de produção da fundação: DefaultPipelineResolverAdapter
 * (store in-process com pipeline canônico).
 */
export function createPipelineResolverPort(
  options: PipelineResolverProviderOptions = {},
): PipelineResolverPort {
  return createPipelineResolverFactory().create(options);
}
