/** Decodifica base64 para bytes — funciona em Node (SSR) e browser. */
export function decodeBase64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
