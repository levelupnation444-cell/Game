/**
 * useTiks — thin wrapper around @rexa-developer/tiks.
 *
 * Rules:
 *  - tiks.init() must be called once on a user gesture.
 *  - All play calls are wrapped in try/catch so they never break the UI.
 *  - `play` returns a callable that silently no-ops if not yet inited.
 */
import { useCallback, useEffect, useRef } from "react";
import { tiks } from "@rexa-developer/tiks";

let inited = false;

function ensureInit() {
  if (!inited) {
    try {
      tiks.init();
      inited = true;
    } catch {}
  }
}

type TikSound =
  | "click"
  | "toggle"
  | "success"
  | "error"
  | "warning"
  | "hover"
  | "pop"
  | "swoosh"
  | "notify";

export function useTiks() {
  // Auto-init on first user interaction anywhere on the page
  useEffect(() => {
    const handler = () => ensureInit();
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  const play = useCallback((sound: TikSound, toggleVal?: boolean) => {
    ensureInit();
    try {
      if (sound === "toggle") {
        tiks.toggle(toggleVal ?? true);
      } else {
        (tiks as any)[sound]?.();
      }
    } catch {}
  }, []);

  return { play };
}
