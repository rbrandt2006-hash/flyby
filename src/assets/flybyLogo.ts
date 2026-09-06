/**
 * The Flyby logo, resolved against the app's base path.
 *
 * The file lives in `public/`, so it is copied to the site root at build time.
 * Referencing it as a bare "/flyby-ai-logo.png" breaks on GitHub Pages, where
 * the app is served from a subfolder (`/flyby/`) — the absolute path resolves
 * to the domain root and 404s.
 *
 * `import.meta.env.BASE_URL` is "/" in development and "/flyby/" in the Pages
 * build, so this is correct in both.
 */
const flybyLogo = {
  url: `${import.meta.env.BASE_URL}flyby-ai-logo.png`,
  alt: "Flyby AI",
};

export default flybyLogo;
