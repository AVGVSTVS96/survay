import { useEffect, useSyncExternalStore } from "react";

const NAVIGATE = "survay:navigate";

export function useSearch(initial: string) {
  return useSyncExternalStore(
    (notify) => {
      addEventListener("popstate", notify);
      addEventListener(NAVIGATE, notify);
      return () => {
        removeEventListener("popstate", notify);
        removeEventListener(NAVIGATE, notify);
      };
    },
    () => location.search,
    () => initial,
  );
}

export function navigate(search: string, { replace = false } = {}) {
  history[replace ? "replaceState" : "pushState"](null, "", search || location.pathname);
  dispatchEvent(new Event(NAVIGATE));
}

export const toParent = (message: { type: `survay:${string}`; [key: string]: unknown }) => {
  if (parent !== window) parent.postMessage(message, "*");
};

export function useEmbed(embed: boolean) {
  useEffect(() => {
    if (!embed) return;
    const post = () =>
      toParent({ type: "survay:height", height: Math.ceil(document.body.getBoundingClientRect().height) });
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [embed]);
}

export function useLive(onChange: () => void) {
  useEffect(() => {
    let source: EventSource | null = null;
    const connect = () => {
      source?.close();
      source = document.visibilityState === "visible" ? new EventSource("/api/live") : null;
      source?.addEventListener("change", onChange);
    };
    const visibility = () => {
      if (document.visibilityState === "visible") onChange();
      connect();
    };
    connect();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      source?.close();
    };
  }, [onChange]);
}

export const session = {
  get(key: string): unknown {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      if (value === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
