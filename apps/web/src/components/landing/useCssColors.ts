import { useEffect, useState } from "react";
import * as THREE from "three";

function read<K extends string>(vars: Record<K, string>): Record<K, THREE.Color> {
  const cs = getComputedStyle(document.documentElement);
  const out = {} as Record<K, THREE.Color>;
  for (const k of Object.keys(vars) as K[]) out[k] = new THREE.Color(cs.getPropertyValue(vars[k]).trim() || "#C9559F");
  return out;
}

/** Scene colours from the theme's CSS variables (mauve-3d §3), re-read when data-theme or the system scheme
 *  changes, so dark mode uses its own designed colours. */
export function useCssColors<K extends string>(vars: Record<K, string>): Record<K, THREE.Color> {
  const key = JSON.stringify(vars);
  const [colors, setColors] = useState(() => read(vars));
  useEffect(() => {
    const v = JSON.parse(key) as Record<K, string>;
    const update = () => setColors(read(v));
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", update);
    };
  }, [key]);
  return colors;
}
