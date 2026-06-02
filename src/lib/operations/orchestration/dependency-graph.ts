/**
 * Construção e validação de DAG para orquestração (loops, ordenação, readiness).
 */
import { ValidationError } from "@/lib/domain/operations/errors";

export type DependencyEdge = { from: number; to: number };

/** Detecta ciclo via DFS (pilha de recursão); retorna um ciclo ou null. */
export function findCycle(n: number, edges: readonly DependencyEdge[]): number[] | null {
  const adj = new Map<number, number[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
  }
  const state = new Array<0 | 1 | 2>(n).fill(0);
  const path: number[] = [];

  function dfs(u: number): number[] | null {
    if (state[u] === 2) return null;
    if (state[u] === 1) {
      const idx = path.indexOf(u);
      return idx >= 0 ? path.slice(idx) : [u];
    }
    state[u] = 1;
    path.push(u);
    for (const v of adj.get(u) ?? []) {
      const c = dfs(v);
      if (c) return c;
    }
    path.pop();
    state[u] = 2;
    return null;
  }

  for (let i = 0; i < n; i++) {
    if (state[i] === 0) {
      const c = dfs(i);
      if (c) return c;
    }
  }
  return null;
}

/** Aresta u → v significa v depende de u (u antes de v). */
export function edgesFromDependsOn(
  nodeCount: number,
  dependsMap: ReadonlyMap<number, readonly number[]>,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  for (let v = 0; v < nodeCount; v++) {
    for (const u of dependsMap.get(v) ?? []) {
      if (u < 0 || u >= nodeCount || v < 0 || v >= nodeCount) {
        throw new ValidationError("Dependência fora do intervalo de ordinais.", {
          v,
          u,
          nodeCount,
        });
      }
      edges.push({ from: u, to: v });
    }
  }
  return edges;
}

/** Ordenação topológica (Kahn). Lança se ciclo ou nó isolado inconsistente. */
export function topologicalOrdering(nodeCount: number, edges: readonly DependencyEdge[]): number[] {
  const indeg = new Array<number>(nodeCount).fill(0);
  const adj = new Map<number, number[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push(e.to);
    indeg[e.to]++;
  }
  const q: number[] = [];
  for (let i = 0; i < nodeCount; i++) {
    if (indeg[i] === 0) q.push(i);
  }
  q.sort((a, b) => a - b);
  const out: number[] = [];
  while (q.length) {
    const u = q.shift()!;
    out.push(u);
    for (const v of adj.get(u) ?? []) {
      indeg[v]--;
      if (indeg[v] === 0) {
        q.push(v);
        q.sort((a, b) => a - b);
      }
    }
  }
  if (out.length !== nodeCount) {
    throw new ValidationError("Grafo de dependências contém ciclo ou nós inatingíveis.");
  }
  return out;
}

export function assertAcyclic(nodeCount: number, edges: readonly DependencyEdge[]): void {
  const c = findCycle(nodeCount, edges);
  if (c) {
    throw new ValidationError("Dependências formam ciclo — orquestração bloqueada pela política.", {
      cycle: c.join(","),
    });
  }
}

/** Verifica se todas as dependências de `ordinal` estão em `completed`. */
export function depsSatisfied(
  ordinal: number,
  dependsOn: readonly number[],
  completed: ReadonlySet<number>,
): boolean {
  for (const d of dependsOn) {
    if (!completed.has(d)) return false;
  }
  return true;
}
