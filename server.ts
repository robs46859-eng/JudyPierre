import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { GeminiService, GEMINI_MODEL } from "./server/geminiService";
import { HermesClient } from "./server/hermesClient";
import { TranslationStore } from "./server/translationStore";
import { TranslationWorker } from "./server/translationWorker";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const hermesGatewayUrl = process.env.HERMES_GATEWAY_URL?.trim() || "";
const store = new TranslationStore(path.resolve(process.env.JUDY_DATA_DIR || "./data"));
const hermes = new HermesClient(
  hermesGatewayUrl,
  process.env.HERMES_BEARER_TOKEN?.trim() || undefined,
  numberFromEnv("HERMES_REQUEST_TIMEOUT_MS", 15_000),
);
const worker = new TranslationWorker(store, hermes, {
  pollIntervalMs: numberFromEnv("HERMES_POLL_INTERVAL_MS", 2_000),
  maxAttempts: numberFromEnv("HERMES_MAX_ATTEMPTS", 90),
  maxJobDurationMs: numberFromEnv("HERMES_JOB_TIMEOUT_MS", 600_000),
});
const gemini = process.env.GEMINI_API_KEY?.trim()
  ? new GeminiService(process.env.GEMINI_API_KEY.trim(), GEMINI_MODEL)
  : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "15mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hermesConfigured: Boolean(hermesGatewayUrl),
    geminiConfigured: Boolean(gemini),
    geminiModel: GEMINI_MODEL,
  });
});

const createTranslation = async (req: express.Request, res: express.Response) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const targetLanguage = typeof req.body?.targetLanguage === "string"
    ? req.body.targetLanguage.trim()
    : "";
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "text and targetLanguage are required" });
  }
  if (text.length > 10_000 || targetLanguage.length > 80) {
    return res.status(413).json({ error: "Translation request is too large" });
  }
  if (!hermesGatewayUrl) {
    return res.status(503).json({ error: "Hermes translation service is not configured" });
  }

  const job = await store.create({
    text,
    targetLanguage,
    source: typeof req.body?.source === "string" ? req.body.source : "judy-web",
    idempotencyKey:
      req.get("Idempotency-Key") ||
      (typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey : undefined),
  });
  void worker.runOnce();
  return res.status(job.status === "completed" ? 200 : 202).json({ job });
};

app.post("/api/translation-requests", createTranslation);
app.post("/api/translate", createTranslation);

app.get("/api/translation-requests", (req, res) => {
  res.json({ jobs: store.list(numberFromQuery(req.query.limit, 25)) });
});

app.get("/api/translation-requests/:id", (req, res) => {
  const job = store.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Translation request not found" });
  return res.json({ job });
});

app.get("/api/completion-log", async (req, res) => {
  res.json({ entries: await store.readCompletionLog(numberFromQuery(req.query.limit, 50)) });
});

app.post("/api/itinerary", async (req, res) => {
  const { destination, days, travelStyle } = req.body ?? {};
  if (!destination || !days || !travelStyle) {
    return res.status(400).json({ error: "destination, days, and travelStyle are required" });
  }
  if (!gemini) return res.status(503).json({ error: "Gemini is not configured" });
  const numDays = Math.min(Math.max(Number.parseInt(String(days), 10) || 3, 1), 7);
  try {
    const parsed = await gemini.generateStructured<{
      title: string;
      overview: string;
      daysList: Array<Record<string, unknown>>;
    }>(
      `Create a ${numDays}-day ${travelStyle} itinerary for ${destination}. Include specific local activities, inclusive and queer-friendly context, and practical etiquette warnings.`,
      "You are Judy, a warm, witty lavender-rhino travel companion. Be playful without stereotyping. Return only schema-valid JSON.",
      itinerarySchema,
    );
    return res.json({
      id: `itinerary-${Date.now()}`,
      destination,
      days: numDays,
      travelStyle,
      ...parsed,
      timestamp: Date.now(),
      model: GEMINI_MODEL,
    });
  } catch (error) {
    console.error("Itinerary API error", error);
    return res.status(502).json({ error: "Gemini could not create the itinerary" });
  }
});

app.post("/api/enhance-photo", async (req, res) => {
  const { base64Image, mishapDescription } = req.body ?? {};
  if (!base64Image && !mishapDescription) {
    return res.status(400).json({ error: "A photo or mishap description is required" });
  }
  if (!gemini) return res.status(503).json({ error: "Gemini is not configured" });
  try {
    const input: Array<Record<string, unknown>> = [];
    if (typeof base64Image === "string" && base64Image) {
      const [header, data = header] = base64Image.includes(",")
        ? base64Image.split(",", 2)
        : ["", base64Image];
      input.push({
        type: "image",
        data,
        mime_type: header.includes("image/jpeg") ? "image/jpeg" : "image/png",
      });
    }
    input.push({
      type: "text",
      text: `Review this travel mishap: ${mishapDescription || "an unexpected travel moment"}. Give it a cinematic title, a kind witty critique, a practical three-step rescue plan, and 2–3 sticker recommendations.`,
    });
    const parsed = await gemini.generateStructured<Record<string, unknown>>(
      input,
      "You are Judy, a warm and theatrical lavender-rhino travel companion. Be funny, supportive, and practical. Return only schema-valid JSON.",
      photoSchema,
    );
    return res.json({ ...parsed, model: GEMINI_MODEL });
  } catch (error) {
    console.error("Photo API error", error);
    return res.status(502).json({ error: "Gemini could not review the travel photo" });
  }
});

async function start(): Promise<void> {
  await store.initialize();
  if (hermesGatewayUrl) worker.start();
  else console.warn("HERMES_GATEWAY_URL is not set; online translation intake will return 503");
  if (!gemini) console.warn("GEMINI_API_KEY is not set; Gemini features will return 503");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(port, "0.0.0.0", () => console.log(`Judy is listening on http://0.0.0.0:${port}`));
}

const itinerarySchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    overview: { type: "string" },
    daysList: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          title: { type: "string" },
          morning: { type: "string" },
          afternoon: { type: "string" },
          evening: { type: "string" },
          judysTip: { type: "string" },
        },
        required: ["day", "title", "morning", "afternoon", "evening", "judysTip"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "overview", "daysList"],
  additionalProperties: false,
};

const photoSchema = {
  type: "object",
  properties: {
    cinematicTitle: { type: "string" },
    judysCritique: { type: "string" },
    rescuePlan: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    stickerRecommendation: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
  },
  required: ["cinematicTitle", "judysCritique", "rescuePlan", "stickerRecommendation"],
  additionalProperties: false,
};

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function numberFromQuery(value: unknown, fallback: number): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

void start().catch((error) => {
  console.error("Judy failed to start", error);
  process.exitCode = 1;
});
