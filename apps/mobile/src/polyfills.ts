// Hermes (the React Native engine) does not ship Intl.PluralRules, which the ICU plural messages need
// ("{count, plural, one {# entry} other {# entries}}"). These FormatJS polyfills only install where missing.
// The ".js" paths are the ones the packages export.
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/ar.js";
