import { useEffect, useState } from "react";

/** True após o primeiro paint no cliente — evita mismatch SSR com localStorage/sessionStorage. */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
