import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
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

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
// The site root (flybyai.net/) shows the marketing landing page in landing/;
// its "Log in to product" button opens the app at /get-started. The React app
// answers every other address (/get-started, /dashboard, /trips, ...).
// See landing/README.md.
//
//   build    the app's page is written as 404.html (GitHub Pages serves it for
//            any address that isn't a file) and landing/index.html becomes
//            index.html. Other files in landing/ (images) go next to it.
//   dev      "/" serves the landing page, everything else is the app.
//   preview  same split as Pages, so `vite preview` behaves like production.
const LANDING_DIR = path.resolve(__dirname, "landing");
const LANDING_SKIP = new Set(["README.md"]);
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function landingFiles(): string[] {
  try {
    return fs
      .readdirSync(LANDING_DIR)
      .filter((f) => !LANDING_SKIP.has(f) && fs.statSync(path.join(LANDING_DIR, f)).isFile());
  } catch {
    return [];
  }
}

function landingPage(): Plugin {
  let outDir = "";
  let base = "/";
  let isBuild = false;

  return {
    name: "flyby-landing-page",

    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      base = config.base;
      isBuild = config.command === "build";
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const pathname = (req.url || "/").split("?")[0];
        const name = pathname === "/" ? "index.html" : pathname.slice(1);
        // Only files that really are in landing/, never a path into a folder.
        if (name.includes("/") || !landingFiles().includes(name)) return next();
        res.setHeader("Content-Type", CONTENT_TYPES[path.extname(name).toLowerCase()] || "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.end(req.method === "HEAD" ? undefined : fs.readFileSync(path.join(LANDING_DIR, name)));
      });
    },

    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const pathname = (req.url || "/").split("?")[0];
        if (!pathname.startsWith(base)) return next();
        const rest = pathname.slice(base.length);
        // The root and real files (assets, images) are served from dist/ as-is.
        if (rest === "" || path.extname(rest)) return next();
        if (BACKEND_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return next();
        const appHtml = path.join(outDir, "404.html");
        if (!fs.existsSync(appHtml)) return next();
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(req.method === "HEAD" ? undefined : fs.readFileSync(appHtml));
      });
    },

    closeBundle() {
      // Vite also calls this when the dev server stops; only touch a real build.
      if (!isBuild) return;
      const appHtml = path.join(outDir, "index.html");
      if (!fs.existsSync(appHtml)) return; // the build failed before writing
      const files = landingFiles();
      if (!files.includes("index.html")) {
        // No landing page: the app stays at the root, with the usual fallback.
        console.warn("[flyby-landing-page] landing/index.html not found; the app is served at the root.");
        fs.copyFileSync(appHtml, path.join(outDir, "404.html"));
        return;
      }
      fs.renameSync(appHtml, path.join(outDir, "404.html"));
      for (const file of files) {
        const dest = path.join(outDir, file);
        if (file !== "index.html" && fs.existsSync(dest)) {
          throw new Error(`landing/${file} would replace public/${file}; rename one of them.`);
        }
        fs.copyFileSync(path.join(LANDING_DIR, file), dest);
      }
    },
  };
}

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
    landingPage(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
