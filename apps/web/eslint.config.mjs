import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs, so no FlatCompat wrapper.
const config = [
  { ignores: [".next/**", ".next-*/**", "node_modules/**", "public/**", "next-env.d.ts", "playwright-report/**", "test-results/**"] },
  ...nextVitals,
  ...nextTs,
  {
    // New in eslint-plugin-react-hooks 7 (React Compiler rules). The 8 hits are deliberate: browser-only values
    // (sessionStorage, window.location, matchMedia) are read after hydration so server and client HTML match, and
    // Date.now() runs in a server component or a click handler. Rewriting them could bring hydration mismatches back.
    // ponytail: warnings, not errors; revisit if the React Compiler is turned on.
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/purity": "warn" },
  },
];

export default config;
