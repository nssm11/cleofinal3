import { useEffect } from "react";

const BASE = "الفِهرِس — THE CINEMA INDEX";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
  }, [title]);
}
