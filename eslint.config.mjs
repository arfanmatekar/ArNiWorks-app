import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const eslintConfig = tseslint.config(
  ...tseslint.configs.recommended,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", `${projectRoot}/.next/**`] },
);

export default eslintConfig;
