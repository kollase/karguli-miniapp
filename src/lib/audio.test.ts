import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { AppAudio, speechKey } from "./audio.ts";
import { audioClips } from "../data/audio-clips.ts";
import { phrases, lessons, alphabet } from "../data/lessons.ts";

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

test("Georgian recordings cover original phrases, dialogue cues and alphabet words", () => {
  const expected = [
    ...phrases.map((p) => p.ka),
    ...alphabet.map((a) => a.word),
  ];
  for (const lesson of lessons)
    for (const step of lesson.steps)
      if ((step.type === "quiz" || step.type === "sign") && step.speaker) expected.push(step.speaker);
  for (const text of expected) {
    assert.ok(audioClips[text]?.startsWith("/audio/ka/"), text);
    assert.ok(
      statSync(new URL(`../../public${audioClips[text]}`, import.meta.url))
        .size > 1000,
    );
  }
});
test("two dialogue lines reuse one media element and finish in order", async () => {
  const player = setup(),
    states: string[] = [];
  player.subscribe((s) => states.push(`${s.status}:${s.index}`));
  await player.speak(
    [{ text: "გამარჯობა" }, { text: "დიდი მადლობა" }],
    0.85,
    0.4,
  );
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].playbackRate, 0.85);
  assert.equal(FakeAudio.instances[0].volume, 0.4);
  assert.ok(states.indexOf("speaking:0") >= 0);
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
    [{ text: "გამარჯობა" }, { text: "დიდი მადლობა" }],
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
  await player.speak([{ text: "გამარჯობა" }], 1, 0.4);
  assert.equal(state.status, "error");
  assert.ok(state.error.length > 0);
  FakeAudio.fail = false;
  await player.speak([{ text: "გამარჯობა" }], 1, 0.4);
  assert.equal(state.status, "idle");
});
test("same speech button stops playback; unsupported sound effects are harmless", async () => {
  const player = setup();
  FakeAudio.autoEnd = false;
  const lines = [{ text: "გამარჯობა" }];
  assert.equal(speechKey(lines), "1|გამარჯობა");
  const pending = player.speak(lines, 1, 0.5);
  await Promise.resolve();
  await player.speak(lines, 1, 0.5);
  await pending;
  await player.effect("correct");
  player.configure(false, 0.5);
  await player.effect("incorrect");
  assert.equal(FakeAudio.instances[0].paused, true);
});
test("Georgian dialogue uses Georgian assets and its own playback identity", async () => {
  const player = setup();
  await player.speak(
    [
      { text: "გამარჯობა", lang: "ka-GE" },
      { text: "დიდი მადლობა", lang: "ka-GE" },
    ],
    1,
    0.45,
  );
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(FakeAudio.instances[0].src, audioClips["დიდი მადლობა"]);
  assert.notEqual(
    speechKey([{ text: "x", lang: "ka-GE" }]),
    speechKey([{ text: "x", lang: "ka-GE" }], 0.75),
  );
});
test("Georgian speech never falls back to a Russian system voice", async () => {
  const player = setup();
  FakeAudio.fail = true;
  let spoke = false,
    state = { status: "", error: "" };
  Object.assign(globalThis.window, {
    SpeechSynthesisUtterance: function () {},
    speechSynthesis: {
      getVoices: () => [{ lang: "ru-RU" }],
      speak: () => {
        spoke = true;
      },
    },
  });
  player.subscribe((s) => (state = s));
  await player.speak([{ text: "გამარჯობა", lang: "ka-GE" }], 1, 0.45);
  assert.equal(spoke, false);
  assert.equal(state.status, "error");
  assert.match(state.error, /грузинский/);
});
test("turtle restarts the current phrase slowly and preserves its pitch", async () => {
  const player = setup();
  FakeAudio.autoEnd = false;
  const lines = [{ text: "გამარჯობა", lang: "ka-GE" as const }];
  const normal = player.speak(lines, 1, 0.4);
  await Promise.resolve();
  const slow = player.speak(lines, 0.75, 0.4, true);
  await normal;
  await Promise.resolve();
  assert.equal(FakeAudio.instances[0].paused, true);
  assert.equal(FakeAudio.instances[1].playbackRate, 0.75);
  assert.equal(FakeAudio.instances[1].src, audioClips["გამარჯობა"]);
  const repeated = player.speak(lines, 0.75, 0.4, true);
  await slow;
  await Promise.resolve();
  assert.equal(FakeAudio.instances[2].playbackRate, 0.75);
  player.stop();
  await repeated;
});
