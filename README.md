# Contraction Counter

[![CI](https://github.com/Robin-w151/contraction-counter/actions/workflows/ci.yaml/badge.svg)](https://github.com/Robin-w151/contraction-counter/actions/workflows/ci.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A small offline-first PWA for timing labour contractions. Tap once when a contraction starts, once
when it ends — the app tracks durations and intervals and tells you whether the **5-1-1 pattern** is
met.

Live at <https://robin-w151.github.io/contraction-counter/>.

> Not medical advice. Always follow the instructions your midwife or doctor gave you.

## Features

- **One-tap timer** — a single start/stop button, with a live clock for the running contraction and
  the time since the last one started.
- **5-1-1 evaluation** — contractions lasting about a minute, about five minutes apart, sustained for
  an hour. Each criterion is shown separately, plus an overall verdict.
- **Offline first** — a service worker precaches the whole app, so it keeps working without a
  connection.
- **Local only** — everything lives in `localStorage`; no accounts, no network calls, no telemetry.
- **Internationalised** — English and German, via Paraglide.
- **Light and dark themes**, following the system preference until you override it.
- **Accessible** — live regions announce start/stop events, criteria expose their met/not-met state to
  screen readers.

## Tech stack

| Concern    | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Framework  | SvelteKit (Svelte 5, runes mode) with static adapter |
| Styling    | Tailwind CSS 4 + Skeleton                            |
| i18n       | Paraglide JS (inlang)                                |
| Dates      | date-fns                                             |
| Icons      | Heroicons via `@steeze-ui/svelte-icon`               |
| Testing    | Vitest (unit), Playwright (e2e)                      |
| Deployment | GitHub Pages via GitHub Actions                      |

## Getting started

Requires Node 24 and pnpm 10.

```sh
pnpm install
pnpm dev          # or: pnpm dev --open
```

## Scripts

| Script           | Description                                        |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Start the dev server                               |
| `pnpm build`     | Build the static production bundle into `build/`   |
| `pnpm preview`   | Serve the production build locally                 |
| `pnpm check`     | Type-check Svelte, the app, and the service worker |
| `pnpm lint`      | Prettier check + ESLint                            |
| `pnpm format`    | Format everything with Prettier                    |
| `pnpm test`      | Unit tests, then e2e tests                         |
| `pnpm test:unit` | Vitest (`--run` for a single pass)                 |
| `pnpm test:e2e`  | Playwright e2e tests                               |
| `pnpm icons`     | Regenerate PNG app icons from the SVG sources      |

## Project structure

```
src/
  lib/
    contractions/          Timer UI and domain logic
      ContractionTimer.svelte
      Rule511Card.svelte
      contractions.svelte.ts   Reactive store: records, running contraction, persistence
      stats/stats.ts           Durations, intervals, 5-1-1 evaluation, formatting
      storage/storage.ts       Versioned, defensive localStorage read/write
      types.ts
    shared/
      components/          AppHeader, AppLayout, LanguageSwitch, ThemeSwitch
      datetime.ts          Offset-aware ISO string helpers
      locale.svelte.ts     Locale state
      theme.svelte.ts      Light/dark mode state
  routes/                  Layout, page, and the generated web manifest
  service-worker/          Precache + offline fetch handling
messages/                  en.json, de.json source messages
e2e/                       Playwright specs
static/                    Icons and robots.txt
```

## How the 5-1-1 check works

`evaluate511` in [stats.ts](src/lib/contractions/stats/stats.ts) looks at the contractions started
within the last hour and checks three things:

- **Duration** — the mean duration in that window is at least 60 s.
- **Interval** — the mean gap between consecutive starts in that window is at most 5 min.
- **Hour** — the very first recorded contraction started at least an hour ago.

All three must hold for the pattern to count as met.

## Data and persistence

Records are stored under the `contractions` key in `localStorage` as a versioned payload. Parsing is
defensive: malformed or unreadable data degrades to an empty state rather than throwing. A
contraction left running for more than 30 minutes is discarded on load, so a forgotten timer doesn't
poison the next session. "Clear all" requires a confirming second tap and wipes the stored state.

## Internationalisation

Messages live in [messages/en.json](messages/en.json) and [messages/de.json](messages/de.json) and are
compiled by Paraglide into `src/lib/paraglide/` (generated, not checked in). Add a key to both files
and use it as `m['some.key']()`. Locale resolution order is `localStorage` → browser preferred
language → base locale (`en`).

## CI/CD

[`.github/workflows/ci.yaml`](.github/workflows/ci.yaml) runs lint plus type-checks and unit tests in
parallel, then builds the site. On `main`, the build is deployed to GitHub Pages with
`BASE_PATH=/contraction-counter`. E2E tests are not part of CI and are run locally with
`pnpm test:e2e`.

## License

[MIT](LICENSE) © Robin Wunderbaldinger
