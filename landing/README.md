# Landing page

The page people see first at https://flybyai.net/. It is Julia's landing page
from https://github.com/juliamxyz/flybyAI (copied at commit `882ceb5`), with
one change: the hero's second button, which was **See it in action**, is
**Log in to product** and opens the app's sign-in page (`get-started`).

## How it is served

- **Build** (`npm run build`): the `flyby-landing-page` plugin in
  `vite.config.ts` writes this page to `dist/index.html` and the React app to
  `dist/404.html`. GitHub Pages serves `index.html` for the site root and
  `404.html` for every other address, so `/get-started`, `/dashboard`,
  `/trips` and the rest all open the app. Other files in this folder (the logo)
  are published next to it.
- **Dev** (`npm run dev`): http://localhost:8080/ is this page; every other
  address is the app, the same as production.
- **Inside the app**, the home page is `/dashboard`. A link to `/` sends
  signed-in people to the dashboard and everyone else to this page.

## Editing

Edit `index.html` here. To bring in a newer version from the flybyAI repo,
copy its `index.html` over this one, then change the hero's **See it in
action** button back to `<a href="get-started" class="btn btn-outline btn-lg">Log in to product</a>`
(it's the one change from the original).

Keep links relative (`href="get-started"`, `src="flybylogo.png"`), never
starting with `/`. The site also runs under `/flyby/` on github.io, and a
leading `/` would point outside it there.
