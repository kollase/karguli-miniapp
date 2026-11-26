import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkBank, matchesChunks } from "./chunks.ts";
import { phraseChunks } from "../data/lessons.ts";
import { assemblyAnswer, assemblyHint, freshProgress, parseProgress } from "./progress.ts";

test("chunk banks preserve every tile and do not start with the complete answer in order", () => {
  for (const [id, chunks] of Object.entries(phraseChunks)) {
    for (let seed = 0; seed < 20; seed++) {
      const bank = chunkBank(chunks, `${id}-${seed}`);
      assert.deepEqual([...bank].sort((a, b) => a.id - b.id).map((t) => t.text), chunks);
      assert.notDeepEqual(bank.map((t) => t.text), chunks);
      assert.ok(matchesChunks(chunks, chunks.map((_, i) => i)));
    }
  }
});

test("checking rejects incomplete, repeated and reordered tiles while keeping identical words distinct", () => {
  const chunks = ["ჩეკი", "არ", "მინდა"];
  assert.equal(matchesChunks(chunks, [0, 1]), false);
  assert.equal(matchesChunks(chunks, [0, 0, 2]), false);
  assert.equal(matchesChunks(chunks, [2, 1, 0]), false);
  assert.equal(matchesChunks(chunks, [0, 1, 9]), false);
  assert.equal(matchesChunks(chunks, [0, 1, 2]), true);
  assert.equal(matchesChunks(["a", "a", "b"], [1, 0, 2]), true);
});

function session() {
  const p = freshProgress();
  p.active = { lessonId: "basics-1", index: 7, correct: [], errors: [] };
  return p;
}
test("assisted assembly survives reload and cannot earn an unassisted answer or mastery", () => {
  const hinted = parseProgress(JSON.stringify(assemblyHint(session(), "assembly")));
  const p = assemblyAnswer(hinted, "assembly", "thanks", true, "2026-11-26");
  assert.deepEqual(p.active?.correct, []);
  assert.deepEqual(p.active?.errors, ["assembly"]);
  assert.equal(p.phrases.thanks.level, 0);
  assert.equal(p.phrases.thanks.due, "2026-11-26");
});
test("assembly retries cannot manufacture first-attempt points; unassisted answers count once", () => {
  const wrong = assemblyAnswer(session(), "assembly", "thanks", false, "2026-11-26");
  const retry = assemblyAnswer(parseProgress(JSON.stringify(wrong)), "assembly", "thanks", true, "2026-11-26");
  assert.deepEqual(retry.active?.correct, []);
  assert.equal(retry.phrases.thanks.level, 0);
  let right = assemblyAnswer(session(), "assembly", "thanks", true, "2026-11-26");
  right = assemblyAnswer(right, "assembly", "thanks", true, "2026-11-26");
  assert.deepEqual(right.active?.correct, ["assembly"]);
  assert.equal(right.phrases.thanks.level, 1);
});
