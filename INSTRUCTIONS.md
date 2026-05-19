# Quest Ledger Developer Notes

Quest Ledger is a local-first DnD 5e-compatible character sheet with local autosave, revision history, backup import/export, 3D dice rolling, and installable PWA support for offline play.

## Project Layout

- `dnd-character-vault/` - all application code.
- `dnd-character-vault/app/` - Next.js app router entry points.
- `dnd-character-vault/src/components/` - React UI components.
- `dnd-character-vault/src/hooks/` - browser hooks for local state, dice rolling, locale, and PWA install.
- `dnd-character-vault/src/lib/` - character schema, DnD 5e math, dice helpers, and local backup storage.
- `dnd-character-vault/public/` - PWA manifest, service worker, app icons, and dice texture assets.
- `dnd-character-vault/src/lib/i18n.js` - English/Russian UI dictionaries.

## Run Locally

Install dependencies once:

```bash
cd dnd-character-vault
npm install
```

Run the development server:

```bash
npm run dev
```

Then open the URL printed by Next.js, usually `http://localhost:3000`.

## Build

The app is configured with `output: "export"` and can be published as static files.

```bash
cd dnd-character-vault
npm run build
```

Static files are exported to `dnd-character-vault/out/`.

For a repository subpath on GitHub Pages, build with a base path:

```bash
NEXT_PUBLIC_BASE_PATH=/dnd-character-vault npm run build
```

## Deploy To GitHub Pages

The repository includes `.github/workflows/pages.yml`. It installs dependencies with `npm ci`, builds the static app with `NEXT_PUBLIC_BASE_PATH=/dnd-character-vault`, and deploys `dnd-character-vault/out`.

## Dice Assets

`@3d-dice/dice-box-threejs` requires its texture assets to be available as static files. The required `.webp` textures are checked into `dnd-character-vault/public/textures/` so the dice renderer works in static builds and on GitHub Pages.

## Install As App

After the static site is served over HTTPS, supported browsers can install it from the browser menu or the in-app install prompt. The service worker caches the app shell after the first load so it can reopen offline.

## Data Model

The app saves:

- The current character sheet.
- Recent local history snapshots.
- Exported backups as JSON files on the user's device.
- Dice roll history for the current session only.
- Selected UI language in local browser storage.

No data is sent to a server.

## Legal Note

This is an unofficial 5e-compatible character sheet. It does not include official Dungeons & Dragons branding assets, third-party art, or copyrighted rulebook text.
