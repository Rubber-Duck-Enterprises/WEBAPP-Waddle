import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    environmentMatchGlobs: [
      ["src/__tests__/*.property.test.tsx", "jsdom"],
      ["src/__tests__/*.test.tsx", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify("test"),
  },
});
