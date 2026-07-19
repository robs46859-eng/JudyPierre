import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

export class GeminiService {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, private readonly model = GEMINI_MODEL) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateStructured<T>(input: string | unknown[], systemInstruction: string, schema: object): Promise<T> {
    const interaction = await this.client.interactions.create({
      model: this.model,
      input: input as never,
      system_instruction: systemInstruction,
      store: false,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema,
      },
    });
    if (!interaction.output_text) throw new Error("Gemini returned no output");
    return JSON.parse(interaction.output_text) as T;
  }
}
