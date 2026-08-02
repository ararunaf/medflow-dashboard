/**
 * ExecutionSchedulerProvider — resolução do ExecutionSchedulerPort (INF-03).
 *
 * Responsável apenas pela resolução do adapter via Factory.
 * Sem lógica de negócio. Sem execução. Sem backends reais.
 */
import {
  createExecutionSchedulerFactory,
  type ExecutionSchedulerFactory,
} from "../factory/execution-scheduler-factory";
import type { ExecutionSchedulerPort } from "../ports/execution-scheduler-port";
import type { SchedulerFoundationProviderOptions } from "../ports/types";

/**
 * Provider canônico da fundação Scheduler.
 * Resolve exclusivamente o adapter solicitado.
 */
export class ExecutionSchedulerProvider {
  private readonly factory: ExecutionSchedulerFactory;

  constructor(factory: ExecutionSchedulerFactory = createExecutionSchedulerFactory()) {
    this.factory = factory;
  }

  /** Resolve o ExecutionSchedulerPort para o provider solicitado. */
  resolve(options: SchedulerFoundationProviderOptions = {}): ExecutionSchedulerPort {
    return this.factory.create(options);
  }
}

/** Factory helper do ExecutionSchedulerProvider. */
export function createExecutionSchedulerProvider(
  factory?: ExecutionSchedulerFactory,
): ExecutionSchedulerProvider {
  return new ExecutionSchedulerProvider(factory);
}

/**
 * Provider / factory do ExecutionSchedulerPort — inversão de dependência (INF-03).
 */
export function createExecutionSchedulerPort(
  options: SchedulerFoundationProviderOptions = {},
): ExecutionSchedulerPort {
  return createExecutionSchedulerProvider().resolve(options);
}
