import type { TranslationJob, TranslationResult } from "./translationTypes";

export interface HermesStatus {
  status: "queued" | "processing" | "completed" | "failed";
  result?: TranslationResult;
  error?: string;
}

export interface HermesTranslationClient {
  submit(job: TranslationJob): Promise<{ jobId: string; status: string }>;
  getStatus(job: TranslationJob): Promise<HermesStatus>;
}

export class HermesClient implements HermesTranslationClient {
  constructor(
    private readonly gatewayUrl: string,
    private readonly bearerToken?: string,
    private readonly timeoutMs = 15_000,
  ) {}

  async submit(job: TranslationJob): Promise<{ jobId: string; status: string }> {
    const data = await this.request("/v1/jobs", {
      method: "POST",
      body: JSON.stringify({
        type: "translate",
        payload: {
          text: job.text,
          target_language: job.targetLanguage,
          source: job.source,
          request_id: job.id,
        },
      }),
    });
    const remoteJob = asRecord(data.job) ?? asRecord(data);
    const jobId = asString(data.job_id) || asString(remoteJob?.id);
    if (!jobId) throw new Error("Hermes accepted the request without returning a job ID");
    return { jobId, status: asString(data.status) || asString(remoteJob?.status) || "queued" };
  }

  async getStatus(job: TranslationJob): Promise<HermesStatus> {
    if (!job.hermesJobId) throw new Error("Cannot poll Hermes before submission");
    const data = await this.request(`/v1/jobs/${encodeURIComponent(job.hermesJobId)}`);
    const remoteJob = asRecord(data.job) ?? asRecord(data);
    const rawStatus = (asString(remoteJob?.status) || asString(data.status) || "processing").toLowerCase();

    if (["failed", "error", "cancelled", "canceled"].includes(rawStatus)) {
      return {
        status: "failed",
        error: asString(remoteJob?.error) || asString(data.error) || "Hermes translation failed",
      };
    }
    if (["completed", "complete", "succeeded", "success", "done"].includes(rawStatus)) {
      return {
        status: "completed",
        result: normalizeResult(remoteJob?.result ?? data.result ?? remoteJob?.output, job),
      };
    }
    return { status: rawStatus === "queued" ? "queued" : "processing" };
  }

  private async request(endpoint: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    if (!this.gatewayUrl) throw new Error("HERMES_GATEWAY_URL is not configured");
    const response = await fetch(`${this.gatewayUrl.replace(/\/$/, "")}${endpoint}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {}),
        ...init.headers,
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const message = asString(body.error) || asString(body.message) || response.statusText;
      throw new Error(`Hermes ${response.status}: ${message}`);
    }
    return body;
  }
}

function normalizeResult(value: unknown, job: TranslationJob): TranslationResult {
  const result = asRecord(value);
  const translatedText =
    asString(result?.translatedText) ||
    asString(result?.translated_text) ||
    asString(result?.translation) ||
    (typeof value === "string" ? value : "");
  if (!translatedText) throw new Error("Hermes completed without a translation result");
  return {
    originalText: asString(result?.originalText) || asString(result?.original_text) || job.text,
    translatedText,
    culturalInsight: asString(result?.culturalInsight) || asString(result?.cultural_insight) || "",
    languageCode: asString(result?.languageCode) || asString(result?.language_code) || job.targetLanguage,
    timestamp: Number(result?.timestamp) || Date.now(),
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
