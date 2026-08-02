/** Gera id de sessão do TISS Runtime (TISS-01). */
export function createTISSRuntimeSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tiss-rt-${crypto.randomUUID()}`;
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `tiss-rt-${hex()}${hex()}-${hex()}-${hex()}`;
}
