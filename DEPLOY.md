# Deploying to Vercel

The app is a static Vite build — no server, no database, no environment
variables. Vercel serves it as plain files behind a CDN.

## The one setting that matters

This is a monorepo. `package.json` lives in `app/`, not at the root, so
Vercel's **Root Directory** must be set to `app`. Everything else is
auto-detected correctly.

## Steps

1. Go to <https://vercel.com/new> and sign in with GitHub.

2. Click **Import** next to `niyazkhairy/Holydaies`. If it is not listed, use
   **Adjust GitHub App Permissions** and grant access to the repo. Prefer
   *Only select repositories* over *All repositories*.

3. Click **Edit** beside **Root Directory** and set it to `app`.

   Vercel then detects Vite and fills in the rest:

   | Setting          | Value           |
   | ---------------- | --------------- |
   | Framework Preset | Vite            |
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |
   | Install Command  | `npm install`   |

   Leave those as detected. `app/package-lock.json` is committed, so installs
   are reproducible.

4. Click **Deploy**. About a minute later you get a `*.vercel.app` URL.

## What you do not need

**No `vercel.json`.** The app uses `HashRouter`, so every route lives after
the `#` (`/#/list/weekly`) and the server is only ever asked for `/`. The
SPA rewrite most Vite deployments need does not apply. If the app is ever
switched to `BrowserRouter`, add `app/vercel.json`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**No environment variables.** Product data, fonts and images are all bundled
into the build.

## Checking the deployment

Open the URL and confirm:

- the phone frame fits without the page scrolling
- text is crisp — the Everyday Sans `.woff2` faces are being served
- product images load on Weekly Start
- **Shop in-store** → tick items → **End trip** shows shopper bars that match
  what you ticked

Fonts or images 404ing means Root Directory was not set to `app`.

## Afterwards

Pushes to the production branch redeploy automatically. Pushes to any other
branch get their own preview URL, which is a convenient way to share a change
before merging it.

## Reproducing the build locally

This is exactly what Vercel runs:

```sh
cd app
npm ci
npm run build      # -> app/dist
npm run preview    # serves the built output
```
