# Auth & Stack Explorer

Explore 14 interactive authentication, authorization, and architecture lessons.
Learning progress and exam scores are stored in the current browser.

## Development

Use Node.js 22. Run `npm ci`, then `npm run dev`.
Run `npm run build` to build the static site in `dist/`.

## Run on your laptop

With Docker running, run `docker compose up -d --build` and visit
<http://127.0.0.1:8080/>. Run `docker compose down` to stop the container.

For public HTTPS from the laptop, configure a tunnel or HTTPS reverse proxy
with origin `http://127.0.0.1:8080`. Point the intended DNS hostname to that
endpoint according to your provider's instructions. Keep tunnel credentials
outside this repository. The laptop and Docker must stay running.

## GitHub Pages

The workflow builds and deploys the site when you push to `main`.
In repository settings, choose GitHub Actions as the Pages publishing source.
