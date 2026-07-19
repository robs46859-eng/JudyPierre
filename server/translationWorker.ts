import type { HermesTranslationClient } from "./hermesClient";
import { TranslationStore } from "./translationStore";
import type { CompletionLogEntry, TranslationJob } from "./translationTypes";

export interface TranslationWorkerOptions {
  pollIntervalMs?: number;
  maxAttempts?: number;
  maxJobDurationMs?: number;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

export class TranslationWorker {
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly pollIntervalMs: number;
  private readonly maxAttempts: number;
  private readonly maxJobDurationMs: number;
  private readonly logger: Pick<Console, "info" | "warn" | "error">;

  constructor(
    private readonly store: TranslationStore,
    private readonly hermes: HermesTranslationClient,
    options: TranslationWorkerOptions = {},
  ) {
    this.pollIntervalMs = options.pollIntervalMs ?? 2_000;
    this.maxAttempts = options.maxAttempts ?? 90;
    this.maxJobDurationMs = options.maxJobDurationMs ?? 600_000;
    this.logger = options.logger ?? console;
  }

  start(): void {
    if (this.timer) return;
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.pollIntervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async runOnce(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (const job of this.store.listPending()) await this.process(job);
    } finally {
      this.running = false;
    }
  }

  private async process(job: TranslationJob): Promise<void> {
    if (Date.now() - Date.parse(job.createdAt) >= this.maxJobDurationMs) {
      await this.fail(job, "Hermes translation timed out");
      return;
    }
    try {
      if (job.status === "queued") {
        const submitted = await this.hermes.submit(job);
        await this.store.update(job.id, {
          hermesJobId: submitted.jobId,
          status: "submitted",
          attempts: job.attempts + 1,
          error: undefined,
        });
        this.logger.info(`[translation] submitted request=${job.id} hermes=${submitted.jobId}`);
        return;
      }

      const remote = await this.hermes.getStatus(job);
      if (remote.status === "completed" && remote.result) {
        const completedAt = new Date().toISOString();
        await this.store.update(job.id, {
          status: "completed",
          result: remote.result,
          completedAt,
          error: undefined,
        });
        await this.logCompletion(job, "completed");
        this.logger.info(`[translation] completed request=${job.id} hermes=${job.hermesJobId}`);
        return;
      }
      if (remote.status === "failed") {
        await this.fail(job, remote.error || "Hermes translation failed");
        return;
      }
      await this.store.update(job.id, {
        status: remote.status === "queued" ? "submitted" : "processing",
        error: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown translation worker error";
      const attempts = job.attempts + 1;
      if (attempts >= this.maxAttempts) {
        await this.fail({ ...job, attempts }, message);
      } else {
        await this.store.update(job.id, { attempts, error: message });
        this.logger.warn(`[translation] retry request=${job.id} attempt=${attempts}: ${message}`);
      }
    }
  }

  private async fail(job: TranslationJob, error: string): Promise<void> {
    const completedAt = new Date().toISOString();
    await this.store.update(job.id, { status: "failed", error, completedAt });
    await this.logCompletion(job, "failed", error);
    this.logger.error(`[translation] failed request=${job.id}: ${error}`);
  }

  private async logCompletion(
    job: TranslationJob,
    status: CompletionLogEntry["status"],
    error?: string,
  ): Promise<void> {
    await this.store.appendCompletion({
      timestamp: new Date().toISOString(),
      requestId: job.id,
      hermesJobId: job.hermesJobId,
      targetLanguage: job.targetLanguage,
      status,
      durationMs: Date.now() - Date.parse(job.createdAt),
      ...(error ? { error } : {}),
    });
  }
}
