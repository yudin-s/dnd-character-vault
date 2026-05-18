# 5e Character Vault

Browser-only DnD 5e-compatible character sheet with local autosave, local revision history, backup import/export, dice rolling, and installable PWA support.

## Project Layout

- `dnd-character-vault/` - all application code.
- `dnd-character-vault/app/` - Next.js app router entry points.
- `dnd-character-vault/src/components/` - React UI components.
- `dnd-character-vault/src/hooks/` - browser hooks for local state and PWA install.
- `dnd-character-vault/src/lib/` - character schema, DnD 5e math, and local backup storage.
- `dnd-character-vault/public/` - PWA manifest, service worker, and app icon.
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

## Deploy To GitHub Pages

The app is configured with `output: "export"` and can be published as static files.

```bash
cd dnd-character-vault
npm run build
```

Publish `dnd-character-vault/out/`.

For a repository subpath on GitHub Pages, build with a base path:

```bash
NEXT_PUBLIC_BASE_PATH=/repository-name npm run build
```

The app uses only browser APIs and stores data in the user's browser through `localStorage`.

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

This is an unofficial 5e-compatible character sheet. It does not include copyrighted rule text, third-party art, or official Dungeons & Dragons branding assets.
