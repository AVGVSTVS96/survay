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

type Message = { type: `survay:${string}`; [key: string]: unknown };

const sent = new Map<string, Message>();
const replies = new Set<() => void>();

export const toParent = (message: Message) => {
  if (parent === window) return;
  sent.set(message.type, message);
  parent.postMessage(message, "*");
};

if (typeof window !== "undefined" && window.parent !== window)
  addEventListener("message", (event: MessageEvent<{ type?: unknown }>) => {
    if (event.source !== parent || event.data.type !== "survay:hello") return;
    for (const message of sent.values()) parent.postMessage(message, "*");
    for (const reply of replies) reply();
  });

export function useEmbed(embed: boolean) {
  useEffect(() => {
    if (!embed) return;
    const post = () =>
      toParent({ type: "survay:height", height: Math.ceil(document.body.getBoundingClientRect().height) });
    const escape = (e: KeyboardEvent) => e.key === "Escape" && toParent({ type: "survay:escape" });
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    replies.add(post);
    post();
    addEventListener("keydown", escape);
    return () => {
      observer.disconnect();
      replies.delete(post);
      removeEventListener("keydown", escape);
    };
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
