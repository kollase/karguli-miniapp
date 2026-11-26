import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { AppAudio, speechKey } from "./audio.ts";
import { audioClips } from "../data/audio-clips.ts";
import { phrases, lessons } from "../data/lessons.ts";

class FakeAudio {
  static instances: FakeAudio[] = [];
  static autoEnd = true;
  static fail = false;
  src = "";
  preload = "";
  playbackRate = 1;
  volume = 1;
  paused = false;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onplaying: (() => void) | null = null;
  constructor() {
    FakeAudio.instances.push(this);
  }
  play() {
    if (FakeAudio.fail) return Promise.reject(new Error("network"));
    queueMicrotask(() => {
      this.onplaying?.();
      if (FakeAudio.autoEnd) this.onended?.();
    });
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  load() {}
  removeAttribute() {
    this.src = "";
  }
}
function setup() {
  FakeAudio.instances = [];
  FakeAudio.autoEnd = true;
  FakeAudio.fail = false;
  Object.assign(globalThis, { Audio: FakeAudio, window: {} });
  return new AppAudio();
}

test("Russian recordings cover all study cards, questions, dialogue cues and settings preview", () => {
  const expected = [
    "Здравствуйте! Давайте познакомимся.",
    ...phrases.map((p) => p.ru),
  ];
  for (const lesson of lessons)
    for (const step of lesson.steps)
      if (step.type !== "study") {
        expected.push(step.prompt);
        if (step.speakerTranslation) expected.push(step.speakerTranslation);
      }
  for (const text of expected) {
    assert.ok(audioClips[text], text);
    assert.ok(
      statSync(new URL(`../../public${audioClips[text]}`, import.meta.url))
        .size > 1000,
    );
  }
  const manifest = JSON.parse(
    readFileSync(
      new URL("../../public/audio/ru/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.length, Object.keys(audioClips).length);
});
test("two dialogue lines reuse one media element and finish in order", async () => {
  const player = setup(),
    states: string[] = [];
  player.subscribe((s) => states.push(`${s.status}:${s.index}`));
  await player.speak(
    [{ text: "Здравствуйте" }, { text: "Большое спасибо" }],
    0.85,
    0.4,
  );
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playbackRate, 0.85);
  assert.equal(FakeAudio.instances[0].volume, 0.4);
  assert.ok(states.indexOf("speaking:0") < states.indexOf("speaking:1"));
  assert.equal(states.at(-1), "idle:-1");
  player.stop();
});
test("stop cancels a pending dialogue without playing the next line", async () => {
  const player = setup();
  FakeAudio.autoEnd = false;
  let state = "";
  player.subscribe((s) => (state = s.status));
  const playing = player.speak(
    [{ text: "Здравствуйте" }, { text: "Большое спасибо" }],
    1,
    0.4,
  );
  await Promise.resolve();
  assert.equal(state, "speaking");
  player.stop();
  await playing;
  assert.equal(state, "idle");
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].paused, true);
});
test("unavailable audio and speech API report a recoverable error", async () => {
  const player = setup();
  FakeAudio.fail = true;
  let state = { status: "", error: "" };
  player.subscribe((s) => (state = s));
  await player.speak([{ text: "Здравствуйте" }], 1, 0.4);
  assert.equal(state.status, "error");
  assert.ok(state.error.length > 0);
  FakeAudio.fail = false;
  await player.speak([{ text: "Здравствуйте" }], 1, 0.4);
  assert.equal(state.status, "idle");
});
test("same speech button stops playback; unsupported sound effects are harmless", async () => {
  const player = setup();
  FakeAudio.autoEnd = false;
  const lines = [{ text: "Здравствуйте" }];
  assert.equal(speechKey(lines), "Здравствуйте");
  const pending = player.speak(lines, 1, 0.5);
  await Promise.resolve();
  await player.speak(lines, 1, 0.5);
  await pending;
  await player.effect("correct");
  player.configure(false, 0.5);
  await player.effect("incorrect");
  assert.equal(FakeAudio.instances[0].paused, true);
});
