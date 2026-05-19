# Quest Ledger

Quest Ledger is a DnD 5e character sheet built around live tabletop moments. It keeps the parts you touch during play in one place: HP, resources, spells, inventory, dice, history snapshots, and portable backups.

The app runs in your browser. Save the character on the current device, export it as JSON, and install it on a phone for quick access at the table after the first load.

## Live App

https://yudin-s.github.io/dnd-character-vault/

## Features

- Session-first play mode with HP, XP, resources, death saves, conditions, and quick rolls.
- Full edit mode for identity, abilities, skills, combat, inventory, spells, and notes.
- Built-in 3D dice roller powered by `@3d-dice/dice-box-threejs`.
- Spellbook with slots, prepared spells, filters, components, casting details, and notes.
- Inventory with equipped gear, weapons, armor, shields, coins, item counters, and weapon rolls.
- Automatic checkpoints after key moments and a restore point list for recovery.
- JSON export/import for session handoffs and portable backups.
- Installable app shell for phone use during a game night.
- No account, backend, or cloud sync required.
- English and Russian UI dictionaries.

## Storage and Privacy

Quest Ledger stores data in the user's browser through `localStorage` and keeps app data available for repeat sessions.

What stays on the device:

- Current character sheet.
- Local history snapshots.
- Selected UI language.
- App shell cache through the service worker.

What is not sent:

- Character data.
- Dice history.
- Backups.

Browser storage can be cleared by the user or browser settings. Export a JSON backup before switching devices or ending a session.

## Install As App

Open the live site over HTTPS, then install it from the browser menu or the in-app install prompt. After the first successful load, the service worker caches the app shell so it can reopen offline.

For practical prep, export your character before a session and re-import after setup if you want a clean handoff.

## Tech Stack

- Next.js app router with static export.
- React.
- Tailwind CSS.
- Lucide icons.
- `@3d-dice/dice-box-threejs` for 3D dice.
- GitHub Pages deployment.

## Development

```bash
cd dnd-character-vault
npm install
npm run dev
```

Then open the URL printed by Next.js, usually `http://localhost:3000`.

## Static Build

```bash
cd dnd-character-vault
npm run build
```

The static output is written to `dnd-character-vault/out`.

For GitHub Pages under the current repository subpath:

```bash
cd dnd-character-vault
NEXT_PUBLIC_BASE_PATH=/dnd-character-vault npm run build
```

## Project Layout

- `dnd-character-vault/app/` - Next.js app router entry points and global CSS.
- `dnd-character-vault/src/components/` - React UI components.
- `dnd-character-vault/src/hooks/` - local state, dice, locale, and PWA hooks.
- `dnd-character-vault/src/lib/` - character schema, 5e math, dice helpers, and storage.
- `dnd-character-vault/public/` - PWA manifest, service worker, icons, and dice textures.

## Legal

Quest Ledger is an unofficial 5e-compatible utility. It does not include official Dungeons & Dragons branding assets, third-party art, or copyrighted rulebook text.

## License

MIT License. See [LICENSE](LICENSE).
