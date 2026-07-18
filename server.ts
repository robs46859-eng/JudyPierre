import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to mock humor responses.");
}

const app = express();
const PORT = 3000;

// Enable JSON parser with high limit for webcam images
app.use(express.json({ limit: "15mb" }));

// 1. Translation Endpoint
app.post("/api/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Missing text or targetLanguage" });
  }

  // Check if API key is configured
  if (!ai) {
    // Elegant witty fallback
    const offlineFallback = {
      originalText: text,
      translatedText: `[Mock Translation to ${targetLanguage}] "${text}"`,
      culturalInsight: "Oh honey, my stellar AI brain is offline! But here is a general tip: smile, wave, and order another sparkling rosé. It solves everything!",
      languageCode: targetLanguage,
      timestamp: Date.now()
    };
    return res.json(offlineFallback);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following phrase into ${targetLanguage}: "${text}". Provide a witty, sassy, but genuinely useful cultural insight or etiquette warning about this phrase, country, or custom.`,
      config: {
        systemInstruction: "You are Judy, a fabulous, travel-loving, witty gay companion who happens to be an elegant lavender Rhino. Speak with absolute charisma, high energy, and queer slang. Use loving names like 'darling', 'honey', 'gorgeous', 'sweetheart', and 'diva'. Translate the phrase accurately, and then provide a hilarious and sassy, yet practical cultural insight, warning the user of any hilarious etiquette disasters or how to charm the locals. Return response in a clean JSON format matching the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: {
              type: Type.STRING,
              description: "The literal and correct translation of the input phrase into the target language.",
            },
            culturalInsight: {
              type: Type.STRING,
              description: "Judy's highly entertaining, fabulous, and informative cultural insight or etiquette tip related to this scenario.",
            },
          },
          required: ["translatedText", "culturalInsight"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json({
      originalText: text,
      translatedText: data.translatedText || "",
      culturalInsight: data.culturalInsight || "Darling, no cultural feedback is needed here. You look stunning anyway!",
      languageCode: targetLanguage,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Translation API Error:", error);
    return res.status(500).json({
      error: "Could not translate. Judy might be sipping mimosas. Please try again!",
      details: error.message
    });
  }
});

// 2. Itinerary Generator Endpoint
app.post("/api/itinerary", async (req, res) => {
  const { destination, days, travelStyle } = req.body;
  if (!destination || !days || !travelStyle) {
    return res.status(400).json({ error: "Missing required query parameters" });
  }

  const numDays = Math.min(Math.max(parseInt(days) || 3, 1), 7); // Safe limit 1-7 days

  if (!ai) {
    // Witty Fallback
    const mockItinerary = {
      id: `itinerary-${Date.now()}`,
      destination,
      days: numDays,
      travelStyle,
      title: `Judy's Fabulous ${destination} Escape`,
      overview: `Darling, without my AI connection, I can only dream! But a ${travelStyle} queen in ${destination} is a match made in heaven. Prepare for sheer luxury and dramatic scenic walks!`,
      daysList: Array.from({ length: numDays }).map((_, index) => ({
        day: index + 1,
        title: `Sashay through Day ${index + 1}`,
        morning: "Wake up late. Put on oversized sunglasses. Demand espresso.",
        afternoon: "Wander through local floral boutiques. Gossip with handsome shopkeepers.",
        evening: "Sunset cocktails on a rooftop, looking effortlessly brilliant.",
        judysTip: "If anyone asks, you are an incognito heiress who forgot her jewelry box."
      })),
      timestamp: Date.now()
    };
    return res.json(mockItinerary);
  }

  try {
    const prompt = `Generate a personalized travel itinerary for ${numDays} days in ${destination} with a "${travelStyle}" travel style. Include humorous travel warnings, fabulous queer-friendly/inclusive vibes, and highly specific local activities. Make it funny, structured, and extremely creative.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Judy, the fabulous lavender Rhino gay travel companion. Create a hilarious, glamorous, and customized day-by-day travel itinerary. Your response must be in JSON and follow the requested schema exactly. Every day should have a dramatic title, morning/afternoon/evening plans, and Judy's signature dramatic travel tip.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A sassy, themed title for the entire itinerary (e.g. 'Judy's Dramatic Venetian Gondola Meltdown').",
            },
            overview: {
              type: Type.STRING,
              description: "Judy's overview of this destination and travel style, highlighting why the user is either a genius or completely unhinged for choosing it.",
            },
            daysList: {
              type: Type.ARRAY,
              description: "A list of days in the itinerary.",
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER, description: "The day number." },
                  title: { type: Type.STRING, description: "The title of the day's theme." },
                  morning: { type: Type.STRING, description: "Judy's recommendation for the morning." },
                  afternoon: { type: Type.STRING, description: "Judy's recommendation for the afternoon." },
                  evening: { type: Type.STRING, description: "Judy's recommendation for the evening." },
                  judysTip: { type: Type.STRING, description: "Judy's specific witty tip or etiquette warning for this day." },
                },
                required: ["day", "title", "morning", "afternoon", "evening", "judysTip"],
              },
            },
          },
          required: ["title", "overview", "daysList"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      id: `itinerary-${Date.now()}`,
      destination,
      days: numDays,
      travelStyle,
      title: parsedData.title || `Fabulous Escape to ${destination}`,
      overview: parsedData.overview || "Time to pack those sequins, darling!",
      daysList: parsedData.daysList || [],
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error("Itinerary API Error:", error);
    return res.status(500).json({
      error: "Judy could not plan your trip. She might be locked in a luxury spa. Try again soon, sweetheart!"
    });
  }
});

// 3. AI Enhanced Photo Editor Endpoint (Multimodal)
app.post("/api/enhance-photo", async (req, res) => {
  const { base64Image, mishapDescription } = req.body;

  if (!base64Image && !mishapDescription) {
    return res.status(400).json({ error: "Please provide a photo or a description of your travel mishap!" });
  }

  if (!ai) {
    // Offline Fallback
    return res.json({
      cinematicTitle: "The Unsynchronized Catastrophe",
      judysCritique: "Oh my darling, my AI eye is currently resting with cucumber slices! But looking at this, it is pure high drama. Your styling is exquisite even in the face of disaster.",
      rescuePlan: [
        "1. Inhale a deep breath of lavender breeze.",
        "2. Find the nearest outdoor café, take a seat, and look incredibly wealthy and bothered.",
        "3. Blame it on the local mercury retrograde. Works every single time!"
      ],
      stickerRecommendation: ["diva_in_distress", "send_help", "fabulous_disaster"]
    });
  }

  try {
    let contents: any[] = [];

    if (base64Image) {
      // Split header data if included
      const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;
      const mimeType = base64Image.includes("image/jpeg") || base64Image.includes("jpg") ? "image/jpeg" : "image/png";

      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const textPrompt = `Analyze this travel photo and mishap description: "${mishapDescription || "A beautiful, hilarious travel accident!"}". Judy, act as a fabulous travel companion and critique this mishap. Provide:
    1. A dramatic and humorous cinematic title for this mishap.
    2. Judy's sassy, theatrical, and loving critique. Be funny about how 'unfortunate' yet 'cinematic' this looks!
    3. Judy's dramatic 3-step rescue plan to save the day in style.
    4. 2 or 3 recommended stickers that match this disaster. Choose from: 'send_help', 'diva_in_distress', 'fabulous_disaster', 'judy_approved', 'lost_in_translation', 'total_drama'.`;

    contents.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are Judy, a fabulous, sassy, and dramatic lavender Rhino gay travel companion who reviews and 'enhances' travel disasters. Look at the photo (if provided) and text, and write a theatrical, loving, and humorous response in JSON according to the schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cinematicTitle: {
              type: Type.STRING,
              description: "A funny cinematic title for the catastrophe (e.g. 'Shattered Dreams on the Spanish Steps')."
            },
            judysCritique: {
              type: Type.STRING,
              description: "Judy's theatrical, humorous, and supportive review of the mishap pictured or described."
            },
            rescuePlan: {
              type: Type.ARRAY,
              description: "A hilarious and mildly practical 3-step guide on how to handle the situation with class.",
              items: { type: Type.STRING }
            },
            stickerRecommendation: {
              type: Type.ARRAY,
              description: "Stickers to overlay on the photo.",
              items: { type: Type.STRING }
            }
          },
          required: ["cinematicTitle", "judysCritique", "rescuePlan", "stickerRecommendation"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);

  } catch (error: any) {
    console.error("Enhance Photo API Error:", error);
    return res.status(500).json({
      error: "Judy could not analyze your beautiful disaster right now. She recommends taking a deep breath and a sip of Prosecco!",
      details: error.message
    });
  }
});

// Vite / Static Files Bridge
import { createServer as createViteServer } from "vite";

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Judy's backend is sashaying on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
