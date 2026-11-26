import { audioClips } from "../data/audio-clips.ts";
import { publicAsset } from "./assets.ts";

export type SoundEffect = "tap" | "correct" | "incorrect" | "complete";
export interface SpeechLine {
  text: string;
  role?: string;
  lang?: "ka-GE";
}
export interface PlaybackState {
  key: string;
  status: "idle" | "loading" | "speaking" | "error";
  index: number;
  error: string;
}
const idle: PlaybackState = { key: "", status: "idle", index: -1, error: "" };
export const speechKey = (lines: SpeechLine[], rate = 1) =>
  `${rate}|${lines.map((l) => l.text).join("\n")}`;

// Original, short UI sounds, synthesized locally. No external audio requests.
const melodies: Record<SoundEffect, [number, number, number][]> = {
  tap: [[640, 0, 0.045]],
  correct: [
    [523.25, 0, 0.12],
    [659.25, 0.075, 0.14],
    [783.99, 0.15, 0.2],
  ],
  incorrect: [
    [330, 0, 0.13],
    [277.18, 0.12, 0.2],
  ],
  complete: [
    [523.25, 0, 0.15],
    [659.25, 0.12, 0.15],
    [783.99, 0.24, 0.16],
    [1046.5, 0.38, 0.32],
  ],
};

export class AppAudio {
  private context: AudioContext | undefined;
  private nodes = new Set<OscillatorNode>();
  private audio: HTMLAudioElement | undefined;
  private utterance: SpeechSynthesisUtterance | undefined;
  private cancelLine: (() => void) | undefined;
  private run = 0;
  private state: PlaybackState = { ...idle };
  private listeners = new Set<(state: PlaybackState) => void>();
  private effectsEnabled = true;
  private volume = 0.45;

  subscribe(listener: (state: PlaybackState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private update(state: PlaybackState) {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }
  configure(enabled: boolean, volume: number) {
    this.effectsEnabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (!enabled) this.stopEffects();
  }
  private stopEffects() {
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.nodes.clear();
  }
  async effect(kind: SoundEffect): Promise<void> {
    if (!this.effectsEnabled || this.volume === 0) return;
    try {
      const Constructor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Constructor) return;
      this.context ??= new Constructor();
      if (this.context.state === "suspended") await this.context.resume();
      if (!this.effectsEnabled || this.context.state !== "running") return;
      this.stopEffects();
      const now = this.context.currentTime;
      for (const [frequency, delay, duration] of melodies[kind]) {
        const oscillator = this.context.createOscillator(),
          gain = this.context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + delay);
        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(
          this.volume * 0.2,
          now + delay + 0.008,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        this.nodes.add(oscillator);
        oscillator.onended = () => {
          this.nodes.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(now + delay);
        oscillator.stop(now + delay + duration + 0.02);
      }
    } catch {
      /* Sound is optional; blocked AudioContext must not interrupt a lesson. */
    }
  }
  stop() {
    this.run++;
    this.cancelLine?.();
    this.cancelLine = undefined;
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
      this.audio = undefined;
    }
    if (this.utterance) {
      window.speechSynthesis?.cancel();
      this.utterance = undefined;
    }
    this.update({ ...idle });
  }
  silence() {
    this.stop();
    this.stopEffects();
  }
  async speak(
    lines: SpeechLine[],
    rate: number,
    volume: number,
    restart = false,
  ): Promise<void> {
    const key = speechKey(lines, rate);
    if (
      !restart &&
      this.state.key === key &&
      (this.state.status === "speaking" || this.state.status === "loading")
    ) {
      this.stop();
      return;
    }
    this.stop();
    this.stopEffects();
    const run = this.run;
    this.update({ key, status: "loading", index: 0, error: "" });
    try {
      for (let i = 0; i < lines.length; i++) {
        if (run !== this.run) return;
        this.update({ key, status: "loading", index: i, error: "" });
        const onStart = () => {
          if (run === this.run)
            this.update({ key, status: "speaking", index: i, error: "" });
        };
        const clip = audioClips[lines[i].text];
        if (clip) {
          try {
            await this.playFile(publicAsset(clip), rate, volume, onStart);
          } catch (error) {
            if (run !== this.run) return;
            if (
              error instanceof DOMException &&
              error.name === "NotAllowedError"
            )
              throw new Error(
                "Браузер заблокировал звук. Нажмите «Послушать» ещё раз или проверьте настройки звука.",
              );
            await this.synthesize(
              lines[i].text,
              "ka-GE",
              rate,
              volume,
              i,
              onStart,
            );
          }
        } else
          await this.synthesize(
            lines[i].text,
            "ka-GE",
            rate,
            volume,
            i,
            onStart,
          );
      }
      if (run === this.run) this.update({ ...idle });
    } catch (error) {
      if (run === this.run)
        this.update({
          key,
          status: "error",
          index: -1,
          error:
            error instanceof Error
              ? error.message
              : "Не удалось воспроизвести речь. Попробуйте ещё раз.",
        });
    }
  }
  private playFile(
    url: string,
    rate: number,
    volume: number,
    onStart: () => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = this.audio ?? new Audio();
      this.audio = audio;
      audio.src = url;
      audio.preload = "auto";
      audio.playbackRate = rate;
      audio.preservesPitch = true;
      audio.volume = volume;
      let finished = false;
      const done = (error?: unknown) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        audio.onended = null;
        audio.onerror = null;
        audio.onplaying = null;
        this.cancelLine = undefined;
        error ? reject(error) : resolve();
      };
      const timeout = setTimeout(() => {
        audio.pause();
        done(new Error("Загрузка аудио заняла слишком долго."));
      }, 30000);
      this.cancelLine = () => {
        audio.pause();
        done();
      };
      audio.onended = () => done();
      audio.onerror = () => done(new Error("Аудиофайл недоступен."));
      audio.onplaying = () => {
        clearTimeout(timeout);
        onStart();
      };
      void audio.play().catch(done);
    });
  }
  private synthesize(
    text: string,
    lang: "ka-GE",
    rate: number,
    volume: number,
    roleIndex: number,
    onStart: () => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
      ) {
        reject(
          new Error(
            "Озвучка сейчас недоступна. Проверьте соединение и попробуйте снова.",
          ),
        );
        return;
      }
      const voices = window.speechSynthesis
        .getVoices()
        .filter(
          (v) => v.lang.toLowerCase().split(/[-_]/)[0] === lang.split("-")[0],
        );
      if (!voices.length) {
        reject(
          new Error(
            `Не удалось загрузить аудио, а грузинский голос на устройстве не найден. Проверьте соединение и попробуйте снова.`,
          ),
        );
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      this.utterance = utterance;
      utterance.lang = lang;
      utterance.voice = voices[roleIndex % voices.length];
      utterance.rate = rate;
      utterance.volume = volume;
      let finished = false;
      const done = (error?: Error) => {
        if (finished) return;
        finished = true;
        utterance.onend = null;
        utterance.onerror = null;
        utterance.onstart = null;
        this.utterance = undefined;
        this.cancelLine = undefined;
        error ? reject(error) : resolve();
      };
      this.cancelLine = () => {
        window.speechSynthesis.cancel();
        done();
      };
      utterance.onstart = onStart;
      utterance.onend = () => done();
      utterance.onerror = () =>
        done(new Error("Не удалось воспроизвести речь. Попробуйте ещё раз."));
      window.speechSynthesis.speak(utterance);
    });
  }
}
export const appAudio = new AppAudio();
