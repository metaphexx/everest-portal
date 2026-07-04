import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite + React SPA. The `@` alias mirrors the tsconfig path (`@/*` -> repo root)
// so every `@/lib/...`, `@/components/...`, `@/app/...` import resolves. The
// regex form only matches `@/` and never scoped npm packages (@vitejs, @types).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: path.resolve(__dirname, ".") + "/" }],
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
});
