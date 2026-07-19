import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CompletionLogEntry,
  CreateTranslationRequest,
  TranslationJob,
} from "./translationTypes";

interface StoreDocument {
  version: 1;
  jobs: TranslationJob[];
}

export class TranslationStore {
  private readonly statePath: string;
  private readonly completionLogPath: string;
  private jobs = new Map<string, TranslationJob>();
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly dataDir: string) {
    this.statePath = path.join(dataDir, "translation-jobs.json");
    this.completionLogPath = path.join(dataDir, "translation-completions.jsonl");
  }

  async initialize(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    try {
      const raw = await readFile(this.statePath, "utf8");
      const document = JSON.parse(raw) as StoreDocument;
      for (const job of document.jobs ?? []) this.jobs.set(job.id, job);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await this.persist();
    }
  }

  async create(input: CreateTranslationRequest): Promise<TranslationJob> {
    const normalizedText = input.text.trim();
    const normalizedLanguage = input.targetLanguage.trim();
    const idempotencyKey = input.idempotencyKey?.trim() || createRequestHash(
      normalizedText,
      normalizedLanguage,
      input.source ?? "judy-web",
    );
    const existing = [...this.jobs.values()].find(
      (job) => job.idempotencyKey === idempotencyKey && job.status !== "failed",
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const job: TranslationJob = {
      id: randomUUID(),
      idempotencyKey,
      text: normalizedText,
      targetLanguage: normalizedLanguage,
      source: input.source?.trim() || "judy-web",
      status: "queued",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    await this.persist();
    return job;
  }

  get(id: string): TranslationJob | undefined {
    return this.jobs.get(id);
  }

  list(limit = 25): TranslationJob[] {
    return [...this.jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, Math.min(limit, 100)));
  }

  listPending(): TranslationJob[] {
    return [...this.jobs.values()].filter((job) =>
      ["queued", "submitted", "processing"].includes(job.status),
    );
  }

  async update(id: string, patch: Partial<TranslationJob>): Promise<TranslationJob> {
    const current = this.jobs.get(id);
    if (!current) throw new Error(`Unknown translation request: ${id}`);
    const next = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    this.jobs.set(id, next);
    await this.persist();
    return next;
  }

  async appendCompletion(entry: CompletionLogEntry): Promise<void> {
    await appendFile(this.completionLogPath, `${JSON.stringify(entry)}\n`, "utf8");
  }

  async readCompletionLog(limit = 50): Promise<CompletionLogEntry[]> {
    try {
      const raw = await readFile(this.completionLogPath, "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .slice(-Math.max(1, Math.min(limit, 200)))
        .reverse()
        .map((line) => JSON.parse(line) as CompletionLogEntry);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  private persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      const document: StoreDocument = { version: 1, jobs: [...this.jobs.values()] };
      const temporaryPath = `${this.statePath}.${process.pid}.tmp`;
      await writeFile(temporaryPath, JSON.stringify(document, null, 2), "utf8");
      await rename(temporaryPath, this.statePath);
    });
    return this.writeQueue;
  }
}

function createRequestHash(text: string, targetLanguage: string, source: string): string {
  return createHash("sha256")
    .update(`${source}\u0000${targetLanguage}\u0000${text}`)
    .digest("hex");
}
