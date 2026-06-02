import { QueryTimeoutError } from "./classify";
import { QUERY_DEFAULT_TIMEOUT_MS } from "./types";

/**
 * Envolve uma promise com timeout — use em queryFn de dados críticos.
 */
export async function raceWithTimeout<T>(
  fn: () => Promise<T>,
  ms = QUERY_DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new QueryTimeoutError()), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
