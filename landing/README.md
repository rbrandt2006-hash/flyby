# Landing page

The page people see first at https://flybyai.net/. It is Julia's landing page
from https://github.com/juliamxyz/flybyAI (copied at commit `882ceb5`), with
these changes (Ryan's design):

- The hero's second button, which was **See it in action**, is
  **Log in to product** and opens the app's sign-in page (`get-started`).
- Carousel slide 1 (`flyby.app / home`) is Ryan's home rendering: greeting,
  "Put Flyby on autopilot in 2 steps", savings numbers, "Needs your yes or
  no", "Flyby activity", and upcoming trips with Detected → Planned → Your
  yes → Booked → Report steps. Its styles are the `.hm-*` rules.
- Carousel slide 2, which showed booking through a chat (`flyby.app / book`),
  now shows a calendar trip waiting for approval (`flyby.app / trips /
  london`). Its styles are the `.ta-*` rules.
- The carousel frame is 464px tall on desktop (was 440px) so slide 1 fits.
  Phones keep 420px; there the `.hm-*` / `.ta-*` rules hide the lesser lines.

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
copy its `index.html` over this one, then redo the changes above: the hero's
**See it in action** button becomes
`<a href="get-started" class="btn btn-outline btn-lg">Log in to product</a>`,
and slides 1 and 2, their `.hm-*` / `.ta-*` styles and the 464px frame come
back from this copy's git history.

Keep links relative (`href="get-started"`, `src="flybylogo.png"`), never
starting with `/`. The site also runs under `/flyby/` on github.io, and a
leading `/` would point outside it there.
