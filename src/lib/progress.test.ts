import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshProgress,
  parseProgress,
  answer,
  streak,
  complete,
  addDays,
} from "./progress.ts";
test("damaged storage and invalid nested values recover safely", () => {
  assert.deepEqual(parseProgress("{broken"), freshProgress());
  assert.deepEqual(parseProgress('{"version":9}'), freshProgress());
  assert.deepEqual(
    parseProgress(
      '{"version":1,"phrases":{"bad":{"level":"oops"}},"active":{"index":-1}}',
    ),
    freshProgress(),
  );
});
test("audio settings migrate without losing existing progress and validate corrupt preferences", () => {
  const old = JSON.stringify({
    version: 1,
    completed: ["basics-1"],
    favorites: ["hello"],
    letters: ["ა"],
  });
  const migrated = parseProgress(old);
  assert.equal(migrated.soundEffects, true);
  assert.equal(migrated.audioVolume, 0.45);
  assert.deepEqual(migrated.completed, ["basics-1"]);
  assert.deepEqual(migrated.favorites, ["hello"]);
  const saved = parseProgress(
    JSON.stringify({
      ...migrated,
      soundEffects: false,
      audioVolume: 0.7,
    }),
  );
  assert.equal(saved.soundEffects, false);
  assert.equal(saved.audioVolume, 0.7);
  const corrupt = parseProgress(
    JSON.stringify({
      ...saved,
      soundEffects: "bad",
      audioVolume: 5,
    }),
  );
  assert.equal(corrupt.soundEffects, true);
  assert.equal(corrupt.audioVolume, 1);
});
test("mastery requires successful retrieval on different days", () => {
  let p = answer(freshProgress(), "hello", true, "2026-11-26");
  assert.equal(p.phrases.hello.level, 1);
  p = answer(p, "hello", true, "2026-11-26");
  assert.equal(p.phrases.hello.level, 1);
  p = answer(p, "hello", true, "2026-11-27");
  assert.equal(p.phrases.hello.level, 2);
  assert.equal(p.phrases.hello.due, "2026-11-30");
});
test("wrong answer is due today and retry cannot inflate score", () => {
  let p = answer(freshProgress(), "hello", false, "2026-11-26");
  p = answer(p, "hello", true, "2026-11-26");
  assert.equal(p.phrases.hello.level, 0);
  assert.equal(p.phrases.hello.due, "2026-11-26");
});
test("streak crosses month and year boundaries and tolerates duplicates", () => {
  assert.equal(
    streak(["2026-12-31", "2027-01-01", "2027-01-01"], "2027-01-02"),
    2,
  );
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(streak(["2026-11-24"], "2026-11-26"), 0);
});
test("completion is idempotent and clears resumable session", () => {
  let p = freshProgress();
  p.active = { lessonId: "basics-1", index: 2, correct: [], errors: [] };
  p = complete(p, "basics-1", ["ა", "მ"], "2026-11-26");
  p = complete(p, "basics-1", ["ა", "მ"], "2026-11-26");
  assert.equal(p.completed.length, 1);
  assert.equal(p.letters.length, 2);
  assert.equal(p.active, undefined);
});
