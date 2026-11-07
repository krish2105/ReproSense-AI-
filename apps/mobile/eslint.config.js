// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

// docs/21 section 3: layouts use start/end, never left/right, so Arabic (RTL) mirrors correctly.
const SIDE_KEYS = ["left", "right", "marginLeft", "marginRight", "paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "src/shared/*", "src/api/types.ts", "src/api/errors.ts"],
  },
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        ...SIDE_KEYS.flatMap((k) =>
          ["JSXAttribute[name.name=/^(style|contentContainerStyle)$/]", "CallExpression[callee.property.name='create']"].map((scope) => ({
            selector: `${scope} Property[key.name='${k}']`,
            message: `Use start/end (for example marginStart) instead of ${k}, so the layout mirrors in Arabic (docs/21).`,
          })),
        ),
        {
          selector: "JSXAttribute[name.name='style'] Property[key.name='textAlign'][value.value='left']",
          message: 'Use textAlign "auto" (or follow the locale) instead of "left" (docs/21).',
        },
      ],
    },
  },
]);
