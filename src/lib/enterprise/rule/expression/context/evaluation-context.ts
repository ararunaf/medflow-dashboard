/**
 * Evaluation Context — EPC-06B FASE 3.
 *
 * Recebe somente dados.
 * Nunca regras. Nunca domínio clínico/TISS/contratos.
 */

/**
 * Contexto de avaliação — bag de dados opacos.
 * O Expression Engine NÃO interpreta semântica de negócio.
 */
export type EvaluationContext = {
  /** Dados estruturais livres (única fonte de leitura do runtime). */
  readonly data: Readonly<Record<string, unknown>>;
  /**
   * Relógio opcional para funções today()/now().
   * Útil em testes; default = Date do sistema.
   */
  readonly now?: Date;
};

/** Cria um Evaluation Context a partir de dados. */
export function createEvaluationContext(
  data: Readonly<Record<string, unknown>> = {},
  options?: { now?: Date },
): EvaluationContext {
  return {
    data,
    ...(options?.now ? { now: options.now } : {}),
  };
}

/**
 * Resolve um caminho no context.data.
 * Ex.: ["user", "age"] → data.user.age
 * Retorna `undefined` se algum segmento não existir.
 */
export function resolvePath(context: EvaluationContext, path: readonly string[]): unknown {
  let current: unknown = context.data;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Indica se o caminho existe (incluindo valor `null`). */
export function pathExists(context: EvaluationContext, path: readonly string[]): boolean {
  if (path.length === 0) return true;
  let current: unknown = context.data;
  for (let i = 0; i < path.length; i += 1) {
    if (current === null || current === undefined) return false;
    if (typeof current !== "object") return false;
    const key = path[i]!;
    if (!(key in (current as Record<string, unknown>))) return false;
    current = (current as Record<string, unknown>)[key];
  }
  return true;
}

/** Relógio efetivo do contexto. */
export function contextNow(context: EvaluationContext): Date {
  return context.now ?? new Date();
}
