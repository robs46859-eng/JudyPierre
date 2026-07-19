import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { TranslationStore } from "../server/translationStore";

test("creates idempotent requests and restores them from disk", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "judy-store-"));
  try {
    const store = new TranslationStore(directory);
    await store.initialize();
    const first = await store.create({ text: "Hello", targetLanguage: "French" });
    const duplicate = await store.create({ text: "Hello", targetLanguage: "French" });
    assert.equal(duplicate.id, first.id);

    const restored = new TranslationStore(directory);
    await restored.initialize();
    assert.equal(restored.get(first.id)?.text, "Hello");
    assert.equal(restored.list().length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("allows a failed request to be retried with the same request content", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "judy-retry-"));
  try {
    const store = new TranslationStore(directory);
    await store.initialize();
    const first = await store.create({ text: "Good night", targetLanguage: "Spanish" });
    await store.update(first.id, { status: "failed", error: "gateway unavailable" });
    const retry = await store.create({ text: "Good night", targetLanguage: "Spanish" });
    assert.notEqual(retry.id, first.id);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
