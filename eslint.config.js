import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/", "**/node_modules/", "**/coverage/"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["api/**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      // allow intentionally unused args/vars when prefixed with _ (e.g. `_req`)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // `import type` keeps type-only imports out of the compiled JS
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "warn", // use the pino logger instead
    },
  },

  // turns off ESLint rules that would fight Prettier — keep it last
  prettier,
);
