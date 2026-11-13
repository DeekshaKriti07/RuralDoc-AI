import { useMemo } from "react";

// Safe translation lookup hook. Missing keys fall back to the supplied English text.
export function useT(dictionary = {}) {
  return useMemo(() => (key, fallback = key) => dictionary[key] || fallback, [dictionary]);
}
export default useT;
