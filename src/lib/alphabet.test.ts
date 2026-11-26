import { test } from "node:test";
import assert from "node:assert/strict";
import { alphabet } from "../data/lessons.ts";
import { alphabetPair, letterPractice, checkedInPractice } from "./alphabet.ts";

test("all 33 letters can be studied before checks in both directions", () => {
  for (const a of alphabet) {
    const pair = alphabetPair(a.letter);
    assert.ok(pair.includes(a.letter));
    assert.equal(new Set(pair).size, 2);
    const steps = letterPractice(pair);
    const introduced = new Set<string>();
    for (const step of steps) {
      assert.ok(step.letter.word.includes(step.letter.letter));
      if (step.type === "study") introduced.add(step.letter.letter);
      else {
        assert.ok(introduced.has(step.letter.letter));
        assert.equal(new Set(step.options.map((o) => o.letter)).size, 2);
        for (const option of step.options) assert.ok(introduced.has(option.letter));
      }
    }
    assert.deepEqual(checkedInPractice(steps, []), []);
    assert.deepEqual(checkedInPractice(steps, [0, 1]), []);
    assert.deepEqual(checkedInPractice(steps, [2, 3]), []);
    assert.deepEqual(checkedInPractice(steps, [2, 3, 4]), [pair[0]]);
    assert.deepEqual(checkedInPractice(steps, [2, 3, 4, 5]), pair);
  }
});

test("invalid or duplicate letters cannot produce a practice or earn credit", () => {
  assert.deepEqual(letterPractice(["ა", "ა"]), []);
  assert.deepEqual(letterPractice(["ა", "bad"]), []);
  assert.deepEqual(checkedInPractice([], [0, 1, 2]), []);
});
