# 5e Character Vault

A browser-only DnD 5e character sheet for live sessions.

The app is built around practical table use: hit points, resources, inventory, spells, dice rolls, autosaved history, and portable JSON backups. Character data stays in the browser unless you export it.

## Live App

https://yudin-s.github.io/dnd-character-vault/

## Features

- Play mode with HP, XP, resources, death saves, conditions, and quick rolls
- Edit mode for the full character sheet
- Built-in 3D dice rolling
- Spellbook, inventory, coins, attacks, notes, and resources
- Local autosave history with restore points
- JSON export and import
- No account or backend required

## Development

```bash
cd dnd-character-vault
npm install
npm run dev
```

For GitHub Pages builds:

```bash
cd dnd-character-vault
NEXT_PUBLIC_BASE_PATH=/dnd-character-vault npm run build
```

## Product Hunt

Launch assets and copy are collected in [docs/product-hunt/launch-kit.md](docs/product-hunt/launch-kit.md).

## License

MIT License. See [LICENSE](LICENSE).
