# CommKit

> Say the right thing — every time.

Communication prompts for professionals at every level. Speak or type your situation. Get 3 calibrated responses backed by research — in under a minute.

---

## What this is

CommKit is a Progressive Web App (PWA) that helps people have hard conversations at work. It uses voice or text input, applies research-backed communication frameworks, and generates three response versions calibrated to the user's profile.

**Core mechanics:**
- **Signals** — behavioral data points collected from usage
- **Layers** — profile depth built from Signals (1–5)
- **Frameworks** — SBI, Harvard, NVC, PREP, COIN, DESC applied invisibly
- **Tag profile** — behavioral tags that evolve over time

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS + Vite |
| Styles | CSS custom properties (no framework) |
| AI | Anthropic Claude via Vercel serverless function |
| Voice | Web Speech API |
| Storage | localStorage (on-device, private) |
| Hosting | Vercel |
| PWA | Service Worker + Web App Manifest |

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/yourusername/commkit.git
cd commkit
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at [console.anthropic.com](https://console.anthropic.com)

### 3. Run locally

```bash
npm run dev
```

Opens at `http://localhost:3000`

> **Note:** The `/api/generate` endpoint requires Vercel CLI to run locally. For pure frontend testing, the app will show a fetch error on generate — this is expected.

### 4. Run with Vercel CLI (full local experience)

```bash
npm install -g vercel
vercel dev
```

Opens at `http://localhost:3000` with the serverless function working.

---

## Project structure

```
commkit/
├── api/
│   └── generate.js          # Vercel serverless — Anthropic API call
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   ├── offline.html          # Offline fallback
│   └── icons/                # App icons (all sizes)
├── src/
│   ├── main.js               # App entry, router, SW registration
│   ├── style.css             # Design system + global styles
│   ├── screens/
│   │   ├── welcome.js        # New user welcome screen
│   │   ├── session.js        # Situation input (voice + text)
│   │   ├── processing.js     # API loading animation
│   │   └── result.js         # Responses, signals, framework, Q&A
│   ├── features/
│   │   ├── api.js            # Prompt builder + fetch wrapper
│   │   ├── voice.js          # Web Speech API state machine
│   │   └── signals.js        # Signal analysis + layer calculation
│   ├── data/
│   │   └── frameworks.js     # All 6 framework definitions
│   └── utils/
│       ├── storage.js        # localStorage wrapper
│       ├── toast.js          # Toast notifications
│       └── share.js          # Native share + fallback sheet
├── index.html                # App shell
├── vite.config.js
├── vercel.json
├── .cursorrules              # Cursor AI context
└── .env.example
```

---

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

Every push to `main` auto-deploys. Every branch gets a preview URL.

### Manual deploy

```bash
npm run build
vercel --prod
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — never exposed to client |
| `VITE_APP_VERSION` | No | Shown in app, used for cache busting |
| `VITE_PLAUSIBLE_DOMAIN` | No | Privacy-friendly analytics domain |

---

## Beta testing

See [BETA.md](./BETA.md) for the full beta testing playbook.

**Quick version:**
1. Deploy to Vercel
2. Share the URL with 5–10 people you know
3. Ask one question: *"Did the conversation go better than you expected?"*

---

## The one metric that matters

> *"Did the conversation go better than you expected?"*

If yes consistently → you have a product. Everything else is execution.

---

## License

MIT — build on it, fork it, learn from it.

---

*Built with Claude · CommKit v1.0 Beta*
