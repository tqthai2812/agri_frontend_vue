import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1", // <--- Ép Vite chạy trên IP 127.0.0.1 thay vì localhost
    port: 5173,
    proxy: {
      // Cấu hình cho các request bắt đầu bằng /sanctum
      "/sanctum": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // Cấu hình cho các request bắt đầu bằng /api
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
