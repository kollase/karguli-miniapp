import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alphabet,
  lessons,
  phrases,
  phraseById,
  scenarios,
  phraseChunks,
} from "./lessons.ts";
test("all five scenarios contain eight reusable phrases and two short lessons", () => {
  assert.equal(phrases.length, 40);
  assert.equal(new Set(phrases.map((p) => p.id)).size, 40);
  for (const s of scenarios) {
    assert.equal(phrases.filter((p) => p.scenario === s.id).length, 8);
    assert.equal(lessons.filter((l) => l.scenarioId === s.id).length, 2);
  }
  for (const l of lessons)
    assert.ok(l.steps.length >= 6 && l.steps.length <= 8);
});
test("every exercise has exactly three valid, unique options and its correct answer", () => {
  for (const l of lessons)
    for (const step of l.steps) {
      assert.ok(phraseById[step.phraseId]);
      if (step.type === "quiz" || step.type === "sign") {
        assert.equal(step.options.length, 3);
        assert.equal(new Set(step.options).size, 3);
        assert.ok(step.options.includes(step.phraseId));
        for (const id of step.options) assert.ok(phraseById[id]);
      }
    }
});
test("lessons only test phrases introduced earlier in the same scenario", () => {
  for (const lesson of lessons) {
    const introduced = new Set<string>();
    for (const step of lesson.steps) {
      assert.equal(
        phraseById[step.phraseId].scenario,
        lesson.scenarioId,
        `${lesson.id}: ${step.phraseId} belongs to another scenario`,
      );
      if (step.type === "study") {
        introduced.add(step.phraseId);
      } else {
        assert.ok(
          introduced.has(step.phraseId),
          `${lesson.id}: ${step.phraseId} was tested before being introduced`,
        );
        if (step.type !== "assemble")
          for (const id of step.options)
            assert.equal(phraseById[id].scenario, lesson.scenarioId);
        if (step.type === "sign") assert.equal(lesson.scenarioId, "signs");
      }
    }
  }
});
test("alphabet contains all 33 distinct Mkhedruli letters with examples", () => {
  assert.equal(alphabet.length, 33);
  assert.equal(new Set(alphabet.map((a) => a.letter)).size, 33);
  for (let i = 0; i < 33; i++)
    assert.ok(
      alphabet.some((a) => a.letter === String.fromCharCode(0x10d0 + i)),
    );
  for (const s of scenarios)
    for (const letter of s.letters)
      assert.ok(alphabet.some((a) => a.letter === letter));
});

test("every conversational lesson includes assembly of an introduced phrase with intact chunks", () => {
  for (const [id, chunks] of Object.entries(phraseChunks)) {
    assert.ok(chunks.length >= 2 && chunks.length <= 5);
    assert.equal(chunks.join(" "), phraseById[id].ka);
  }
  for (const lesson of lessons) {
    const assembly = lesson.steps.filter((s) => s.type === "assemble");
    assert.equal(assembly.length, lesson.scenarioId === "signs" ? 0 : 1);
    for (const step of assembly) {
      assert.equal(step.chunks.join(" "), phraseById[step.phraseId].ka);
      assert.ok(lesson.steps.slice(0, lesson.steps.indexOf(step)).some((s) => s.type === "study" && s.phraseId === step.phraseId));
    }
  }
});
