import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// The Flyby AI Flask backend (../flyby_ai). Every backend path is proxied to it,
// so in development the browser talks to the dev server same-origin — no CORS
// setup, and no backend host baked into the app.
//
// Set VITE_API_URL to point at a backend on another host (split deploy).
const BACKEND_URL = process.env.VITE_API_URL || "http://localhost:8659";

const BACKEND_PATHS = ["/api", "/auth", "/rest", "/functions", "/storage", "/health"];

// Security headers browsers only honour over HTTP — setting them in a <meta>
// tag does nothing. Sent here in development; in production whatever serves
// `dist/` needs to send the same set.
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // `payment=*` is required so Duffel's card component can delegate the Payment
  // Request feature down to its nested Stripe/3-D-Secure iframes. Without it the
  // browser blocks payment in the document ("payment is not allowed").
  "Permissions-Policy":
    "camera=(), microphone=(self), geolocation=(), payment=*, usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
};

// Base path for the built site. On GitHub Pages this repo is a *project* page,
// served from a subfolder (rbrandt2006-hash.github.io/flyby/), so production
// assets must be prefixed with "/flyby/". Dev stays at "/". Override with
// VITE_BASE if you deploy somewhere else (a user page or custom domain use "/").
const BASE = process.env.VITE_BASE || "/flyby/";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? BASE : "/",
  server: {
    host: "::",
    port: 8080,
    headers: SECURITY_HEADERS,
    proxy: Object.fromEntries(
      BACKEND_PATHS.map((prefix) => [prefix, { target: BACKEND_URL, changeOrigin: true }]),
    ),
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
