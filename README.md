# SeeMyVoice

SeeMyVoice is an accessibility-focused web app that turns written text into a visual sign-language sequence. Enter a phrase, choose a target sign language, and review the result in an interactive signing player using sign videos, local sign assets, and fingerspelling fallbacks where needed.

> **Status:** Active Base44/Vite application. The app is designed to make written communication easier to follow visually; it is not a replacement for a qualified sign-language interpreter or native-speaker review.

## What it does

- Accepts text in multiple written languages.
- Uses the Base44 `translateText` function to normalize non-English input before sign conversion when available.
- Converts text into an ordered sign sequence using the local dictionary and ASL grammar rules.
- Looks up sign videos for the selected sign language and falls back to animated signs or fingerspelling when a video is unavailable.
- Provides playback controls, replay, looping, fullscreen mode, progress tracking, and adjustable signing speed.
- Shows the original text, translated text when applicable, sign gloss references, unavailable signs, and fingerspelling notices.
- Includes a multilingual interface, accessibility-minded labels, authentication screens, terms, and privacy pages.

## Supported sign languages

The selector currently includes a broad set of sign-language options, including:

- American Sign Language (ASL)
- British Sign Language (BSL)
- Auslan
- French Sign Language (LSF)
- German Sign Language (DGS)
- Spanish Sign Language (LSE)
- Italian Sign Language (LIS)
- Japanese Sign Language (JSL)
- Chinese Sign Language (CSL)
- Portuguese Sign Language (LGP)
- International Sign
- Additional European, Latin American, and regional sign languages

Video sources are associated with each language in `src/data/signLanguages.js`. Availability varies by word, language, and external dictionary source.

## Tech stack

- React 18
- Vite 6
- JavaScript with TypeScript tooling for type checking
- React Router
- Tailwind CSS
- Radix UI primitives
- TanStack Query
- Base44 SDK and Vite plugin
- Framer Motion, Lucide React, and supporting UI libraries

## Project structure

```text
.
├── base44/                 # Base44 app configuration, entities, and functions
├── src/
│   ├── api/                # Base44 SDK client
│   ├── components/         # App UI and reusable components
│   ├── data/               # Sign languages, ASL dictionary, and fingerspelling data
│   ├── hooks/               # Data-fetching and application hooks
│   ├── lib/                 # Auth, routing helpers, query client, and app parameters
│   ├── pages/               # Home, authentication, legal, and error pages
│   └── utils/               # Local translation and sign-sequence logic
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Prerequisites

- Node.js 18 or newer
- npm
- Access to the connected Base44 app if you need backend functions, authentication, or publishing

## Run locally

Clone the repository and install dependencies:

```bash
git clone https://github.com/TejusBhasin/seemyvoice.git
cd seemyvoice
npm install
```

### Frontend-only development

Use this when working on the Vite frontend against a hosted Base44 backend:

```bash
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

Create `.env.local` in the project root when the app needs explicit Base44 connection details:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
# Optional, when required by the deployed Base44 setup:
VITE_BASE44_FUNCTIONS_VERSION=your_functions_version
```

Do not commit `.env.local` or access tokens. The app can also receive Base44 parameters through the runtime URL when launched by the Base44 tooling.

### Full Base44 development

Install the Base44 CLI if it is not already available:

```bash
npm install -g base44@latest
```

Then start the local Base44 environment:

```bash
base44 dev
```

The repository config uses `npm install`, `npm run build`, `npm run dev`, and `./dist` for the install, build, serve, and output steps respectively. See `base44/config.jsonc` for the current configuration.

## Available scripts

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build in dist/
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint checks
npm run lint:fix  # Fix automatically fixable ESLint issues
npm run typecheck # Run TypeScript checks using jsconfig.json
```

Before submitting changes, run at least:

```bash
npm run lint
npm run typecheck
npm run build
```

## How translation works

1. The user enters text and selects a target sign language.
2. The app starts a short countdown and requests text normalization from the Base44 `translateText` function.
3. If the backend response is unavailable, the app falls back to the original text.
4. `src/utils/localTranslator.js` normalizes the text, matches known phrases, applies local ASL grammar rules, and builds an ordered sign sequence.
5. The signing player resolves video assets for the selected language. Missing assets can use animated fallback content or letter-by-letter fingerspelling, depending on settings.

The local translator is deterministic and does not itself make network calls. Backend translation and external sign-video lookups may require a configured Base44 environment and network access.

## Base44 workflow

This repository is connected to Base44. Changes pushed to GitHub can be reflected in the Base44 Builder.

To open the connected Base44 dashboard:

```bash
base44 dashboard open
```

Publish changes from the Base44 dashboard after validating them locally. For Base44-specific setup and CLI usage, see the [Base44 CLI documentation](https://docs.base44.com/developers/references/cli/get-started/overview) and [Base44 GitHub integration documentation](https://docs.base44.com/Integrations/Using-GitHub).

## Contributing

1. Create a focused branch from the default branch.
2. Make the smallest change that solves the problem.
3. Keep secrets and local configuration out of Git.
4. Run linting, type checking, and the production build.
5. Open a pull request with a clear description of the user-facing impact and test steps.

Please preserve the existing Base44 SDK client and project conventions. For repository-specific agent guidance, read [`AGENTS.md`](./AGENTS.md).

## License

This project is distributed under the custom source-available license in [`LICENSE`](./LICENSE). Review that file before using, modifying, distributing, or commercially exploiting the software. Third-party dependencies and external sign-language assets may have separate licenses and attribution requirements.
