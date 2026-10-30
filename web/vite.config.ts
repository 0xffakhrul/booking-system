import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/lib/api` instead of `../../lib/api`; shadcn/ui expects this alias too
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // must match APP_ORIGIN in docker-compose.yml, so fail instead of moving to 5174
    strictPort: true,
    proxy: {
      // the browser only talks to :5173, so cookies and the Origin check work like production
      "/api": "http://localhost:3009",
    },
  },
});
