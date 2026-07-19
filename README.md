# Judy Pierre

Judy is a top-down travel companion interface with a 3D avatar, Hermes-backed asynchronous translation, and Gemini-powered itinerary and travel-photo assistance.

## Local development

1. Install Node.js 22 and run `npm install`.
2. Copy `.env.example` to `.env` and set `HERMES_GATEWAY_URL`. Add the optional Hermes bearer token if the service requires one.
3. Set `GEMINI_API_KEY` to a server-side Google AI Studio authorization key. The default model is `gemini-3.5-flash`; override it with `GEMINI_MODEL` only when intentionally testing another supported model.
4. Run `npm run dev` and open `http://localhost:3000`.

Do not prefix secrets with `VITE_`; that would expose them to the browser bundle. `npm run check` runs type checking, automated tests, and the production build.

## Translation automation

`POST /api/translation-requests` accepts `{ text, targetLanguage, source?, idempotencyKey? }` and returns a durable job. The worker submits `type: "translate"` to Hermes at `POST /v1/jobs`, polls `GET /v1/jobs/:jobId`, restores pending work after restart, and stores final results in `JUDY_DATA_DIR/translation-jobs.json`. A compact operational record is appended to `translation-completions.jsonl` and is available through `GET /api/completion-log`.

For production, mount `JUDY_DATA_DIR` to persistent storage. This repository contains no deployment workflow; deployment remains a separate, explicit action.

## 3D asset note

The included Tripo GLB contains a textured mesh but no skeletal animation clips or morph targets. Judy therefore uses subtle procedural breathing, bobbing, and conversational motion. Replace the asset with a truly rigged/animated GLB to enable clip-based idle and talking animation automatically.
