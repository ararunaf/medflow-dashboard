/**
 * ExecutionWorkerProvider — resolução do ExecutionWorkerPort (INF-02).
 *
 * Responsável apenas pela resolução do adapter via Factory.
 * Sem lógica de negócio. Sem execução. Sem backends reais.
 */
import {
  createExecutionWorkerFactory,
  type ExecutionWorkerFactory,
} from "../factory/execution-worker-factory";
import type { ExecutionWorkerPort } from "../ports/execution-worker-port";
import type { WorkerFoundationProviderOptions } from "../ports/types";

/**
 * Provider canônico da fundação Worker.
 * Resolve exclusivamente o adapter solicitado.
 */
export class ExecutionWorkerProvider {
  private readonly factory: ExecutionWorkerFactory;

  constructor(factory: ExecutionWorkerFactory = createExecutionWorkerFactory()) {
    this.factory = factory;
  }

  /** Resolve o ExecutionWorkerPort para o provider solicitado. */
  resolve(options: WorkerFoundationProviderOptions = {}): ExecutionWorkerPort {
    return this.factory.create(options);
  }
}

/** Factory helper do ExecutionWorkerProvider. */
export function createExecutionWorkerProvider(
  factory?: ExecutionWorkerFactory,
): ExecutionWorkerProvider {
  return new ExecutionWorkerProvider(factory);
}

/**
 * Provider / factory do ExecutionWorkerPort — inversão de dependência (INF-02).
 */
export function createExecutionWorkerPort(
  options: WorkerFoundationProviderOptions = {},
): ExecutionWorkerPort {
  return createExecutionWorkerProvider().resolve(options);
}
