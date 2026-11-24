# Landing page

The page people see first at https://flybyai.net/. It is Julia's landing page
from https://github.com/juliamxyz/flybyAI (copied at commit `882ceb5`), with
these changes (Ryan's design):

- The hero's second button, which was **See it in action**, is
  **Log in to product** and opens the app's sign-in page (`get-started`).
- The carousel has four slides. The first, which showed booking through a chat
  (`flyby.app / book`), now shows a calendar trip waiting for approval
  (`flyby.app / trips / london`). Its styles are the `.ta-*` rules.
- Ryan's home rendering (`flyby.app / home`) was in the carousel for a while
  and was taken out at his request. It is in this file's git history (commit
  `8a88f39`) if it is ever wanted again.

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
and the trip slide and its `.ta-*` styles come back from this copy's git
history.

Keep links relative (`href="get-started"`, `src="flybylogo.png"`), never
starting with `/`. The site also runs under `/flyby/` on github.io, and a
leading `/` would point outside it there.
