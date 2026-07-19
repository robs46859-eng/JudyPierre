import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { HermesStatus, HermesTranslationClient } from "../server/hermesClient";
import { TranslationStore } from "../server/translationStore";
import { TranslationWorker } from "../server/translationWorker";
import type { TranslationJob } from "../server/translationTypes";

const silentLogger = { info() {}, warn() {}, error() {} };

test("submits, tracks, stores, and logs a completed Hermes translation", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "judy-worker-"));
  try {
    const store = new TranslationStore(directory);
    await store.initialize();
    const job = await store.create({ text: "Where is the train?", targetLanguage: "Italian" });
    const statuses: HermesStatus[] = [
      { status: "processing" },
      {
        status: "completed",
        result: {
          originalText: job.text,
          translatedText: "Dov'è il treno?",
          culturalInsight: "",
          languageCode: "Italian",
          timestamp: Date.now(),
        },
      },
    ];
    const hermes: HermesTranslationClient = {
      async submit() { return { jobId: "hermes-123", status: "queued" }; },
      async getStatus() { return statuses.shift()!; },
    };
    const worker = new TranslationWorker(store, hermes, { logger: silentLogger });

    await worker.runOnce();
    assert.equal(store.get(job.id)?.status, "submitted");
    await worker.runOnce();
    assert.equal(store.get(job.id)?.status, "processing");
    await worker.runOnce();

    const completed = store.get(job.id);
    assert.equal(completed?.status, "completed");
    assert.equal(completed?.result?.translatedText, "Dov'è il treno?");
    const log = await store.readCompletionLog();
    assert.equal(log.length, 1);
    assert.equal(log[0].status, "completed");
    assert.equal(log[0].hermesJobId, "hermes-123");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("records a failed Hermes job in the completion log", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "judy-failed-"));
  try {
    const store = new TranslationStore(directory);
    await store.initialize();
    const job = await store.create({ text: "Hello", targetLanguage: "Greek" });
    const hermes: HermesTranslationClient = {
      async submit() { return { jobId: "hermes-fail", status: "queued" }; },
      async getStatus(_job: TranslationJob) { return { status: "failed", error: "model unavailable" }; },
    };
    const worker = new TranslationWorker(store, hermes, { logger: silentLogger });
    await worker.runOnce();
    await worker.runOnce();

    assert.equal(store.get(job.id)?.status, "failed");
    assert.equal((await store.readCompletionLog())[0].error, "model unavailable");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
