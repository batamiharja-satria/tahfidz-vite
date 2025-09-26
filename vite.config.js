import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // biar path asset relatif
  build: {
    target: "es2015", // ✅ aman buat Hermes
    outDir: "dist", // hasil build tetap di folder dist (default)
    assetsDir: "assets", // js/css/img taruh di dist/assets
  },
});
