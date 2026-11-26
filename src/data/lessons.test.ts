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
test("scenario content is complete and divided into four-card lessons", () => {
  assert.equal(scenarios.length, 9);
  assert.equal(lessons.length, 20);
  assert.equal(phrases.length, 80);
  assert.equal(new Set(phrases.map((p) => p.id)).size, 80);
  for (const s of scenarios) {
    assert.equal(phrases.filter((p) => p.scenario === s.id).length, s.id === "numbers" ? 16 : 8);
    assert.equal(lessons.filter((l) => l.scenarioId === s.id).length, s.id === "numbers" ? 4 : 2);
  }
  for (const l of lessons)
    assert.ok(l.steps.length >= 6 && l.steps.length <= 9);
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

test("phrase assembly uses introduced phrases and preserves every authored chunk", () => {
  for (const [id, chunks] of Object.entries(phraseChunks)) {
    assert.ok(chunks.length >= 2 && chunks.length <= 7);
    assert.equal(chunks.join(" "), phraseById[id].ka);
  }
  for (const lesson of lessons) {
    const assembly = lesson.steps.filter((s) => s.type === "assemble");
    const expected = lesson.scenarioId === "numbers"
      ? [0, 0, 1, 2][lesson.part - 1]
      : lesson.scenarioId === "signs" ? 0 : 1;
    assert.equal(assembly.length, expected);
    for (const step of assembly) {
      assert.equal(step.chunks.join(" "), phraseById[step.phraseId].ka);
      assert.ok(lesson.steps.slice(0, lesson.steps.indexOf(step)).some((s) => s.type === "study" && s.phraseId === step.phraseId));
    }
  }
});


test("new everyday lessons introduce all answer options before testing them", () => {
  for (const scenarioId of ["home", "transport", "social", "numbers"]) {
    const scenarioLessons = lessons.filter((l) => l.scenarioId === scenarioId);
    assert.equal(scenarioLessons.length, scenarioId === "numbers" ? 4 : 2);
    for (const lesson of scenarioLessons) {
      const seen = new Set<string>();
      for (const step of lesson.steps) {
        if (step.type === "study") seen.add(step.phraseId);
        else if (step.type !== "assemble")
          for (const option of step.options)
            assert.ok(seen.has(option), `${lesson.id}: unknown option ${option}`);
      }
    }
  }
});

test("every phrase has readable Russian, Georgian and a Cyrillic pronunciation", () => {
  for (const phrase of phrases) {
    assert.match(phrase.ru, /[А-Яа-яЁё]/u, phrase.id);
    assert.match(phrase.ka, /[ა-ჰ]/u, phrase.id);
    assert.match(phrase.pronunciation, /[А-Яа-яЁё]/u, phrase.id);
    assert.doesNotMatch(phrase.pronunciation, /[ა-ჰ]/u, phrase.id);
  }
});


test("numbers are introduced before ordering quantities and both requested orders are practiced", () => {
  const numberLessons = lessons.filter((l) => l.scenarioId === "numbers");
  const studied = numberLessons.flatMap((l) => l.steps.filter((s) => s.type === "study").map((s) => s.phraseId));
  const numeric = studied.slice(0, 10).map((id) => Number.parseInt(phraseById[id].ru));
  assert.deepEqual(numeric, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const assemblies = numberLessons.flatMap((l) => l.steps.filter((s) => s.type === "assemble"));
  for (const id of ["order-two-each", "order-coffee-donuts"]) {
    assert.ok(assemblies.some((s) => s.phraseId === id), id);
    assert.ok(studied.indexOf(id) > studied.indexOf("number-two"));
  }
  assert.equal(phraseChunks["order-two-each"].filter((chunk) => chunk === "ორი").length, 2);
});
