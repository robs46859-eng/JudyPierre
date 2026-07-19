export type TranslationJobStatus =
  | "queued"
  | "submitted"
  | "processing"
  | "completed"
  | "failed";

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  culturalInsight: string;
  languageCode: string;
  timestamp: number;
}

export interface TranslationJob {
  id: string;
  idempotencyKey: string;
  text: string;
  targetLanguage: string;
  source: string;
  status: TranslationJobStatus;
  hermesJobId?: string;
  result?: TranslationResult;
  error?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CompletionLogEntry {
  timestamp: string;
  requestId: string;
  hermesJobId?: string;
  targetLanguage: string;
  status: "completed" | "failed";
  durationMs: number;
  error?: string;
}

export interface CreateTranslationRequest {
  text: string;
  targetLanguage: string;
  source?: string;
  idempotencyKey?: string;
}
