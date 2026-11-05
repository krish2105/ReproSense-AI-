import { setConsoleFunction } from "three";

// @react-three/fiber 9.8.2 (the latest release) still builds its frame clock with THREE.Clock, which three r183+
// marks deprecated, so every canvas logs the same notice. Only that notice is dropped; every other three.js
// message still reaches the console. Remove this file once fiber moves to THREE.Timer.
const KNOWN = "THREE.Clock: This module has been deprecated";

setConsoleFunction((type, message, ...params) => {
  if (type === "warn" && message.startsWith(KNOWN)) return;
  console[type](message, ...params);
});
