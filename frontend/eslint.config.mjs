import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // The legacy dashboard intentionally synchronizes modal/form state from
      // selected records. React Compiler is not enabled for this project.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  globalIgnores([
      "node_modules/**",
      "node_modules.icloud-backup/**",
      ".next/**",
      ".next.icloud-backup/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
  ]),
]);

export default eslintConfig;
