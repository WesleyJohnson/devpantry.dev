# DevPantry

[devpantry.dev](https://devpantry.dev) — a collection of everyday developer utilities (formatters, converters, validators, decoders, and more) that run 100% client-side.

Nothing you paste into a DevPantry tool is ever sent to a server. Every tool runs entirely in your browser — open the Network tab while using one to see for yourself.

## Why client-side only

Developer tools regularly touch things people shouldn't paste into a random website: production config, tokens, certificates, real payloads. DevPantry avoids that problem entirely by not having a backend to send it to. All processing, formatting, and validation happens locally in your browser and stays there.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- No CDN-loaded dependencies — every library a tool needs is bundled and shipped with the app, not fetched from a third party at runtime

## Running locally

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Contributing

Issues and pull requests are welcome. If you're proposing a new tool, keep in mind the project deliberately avoids two categories: tools that ask users to input sensitive data (even client-side), and low-value one-offs already well served by AI scaffolding or starter kits (e.g. a `.gitignore` generator).

## License

MIT — see [LICENSE](LICENSE).
