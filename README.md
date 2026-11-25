# AniTrack

A responsive, static anime tracker made for GitHub Pages.

## Features
- Overview with current-season anime and popular currently airing anime.
- Search anime and add it to your personal list.
- Statuses: Currently watching, Waiting for new release, Completed, Gave up on, and On pause.
- Optional personal rating from 1 to 10, including **Rate later**.
- Your ranking sorts rated anime from highest to lowest.
- Add comments/notes to any anime in your list.
- Open the selected anime's Anikoto page (the current integration links to Anikoto's catalogue/filter page).
- Saves your library in the browser's `localStorage` on the current device/browser.

## Anime catalogue
AniTrack uses the public Jikan API (MyAnimeList catalogue data) for discovery, current-season and popular-anime sections. Anikoto's browse page exposes a large paginated catalogue, but no supported public API for importing its entire catalogue was identified. This app therefore does **not** claim to contain every Anikoto listing. Search results are catalogue matches from Jikan, and anime pages link to Anikoto's site. The Anikoto page URL is a generic catalogue link because a reliable title-to-Anikoto-slug mapping is not exposed here.

Jikan API: https://docs.api.jikan.moe/

## Publish on GitHub Pages
1. Download and unzip `anitrack-github-pages.zip`.
2. Create a new public GitHub repository named `anitrack` (or any name you prefer).
3. Upload `index.html`, `style.css`, `app.js`, and this `README.md` to the repository root.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch **main** and folder **/(root)**, then Save.
7. Wait for GitHub Pages to finish. Your site will be at `https://YOUR-USERNAME.github.io/anitrack/`.

No build step or server is required.

## Important
- Your tracker data stays in the browser's local storage. It will not automatically sync between devices or browsers. Clearing browser site data can erase the list, so export/backup is not currently included.
- Live catalogue data needs an internet connection and the Jikan API to be available.
- The Anikoto link opens the site, not an embedded player. AniTrack does not host anime video.
