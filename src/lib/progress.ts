export interface PhraseProgress {
  seen: boolean;
  level: number;
  due: string;
  lastAttempt: string | null;
}
export interface ActiveSession {
  lessonId: string;
  index: number;
  correct: string[];
  errors: string[];
  reviewIds?: string[];
}
export interface Progress {
  version: 1;
  phrases: Record<string, PhraseProgress>;
  completed: string[];
  letters: string[]; // Legacy automatic unlocks, retained without counting as practice.
  checkedLetters: string[];
  favorites: string[];
  activityDays: string[];
  immersion: boolean;
  theme: "auto" | "light" | "dark";
  soundEffects: boolean;
  audioVolume: number;
  active?: ActiveSession;
}
export const STORAGE_KEY = "karguli.progress.v1";
export const freshProgress = (): Progress => ({
  version: 1,
  phrases: {},
  completed: [],
  letters: [],
  checkedLetters: [],
  favorites: [],
  activityDays: [],
  immersion: true,
  theme: "auto",
  soundEffects: true,
  audioVolume: 0.45,
});
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + count);
  return localDay(date);
}
const validDay = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  localDay(new Date(`${value}T12:00:00`)) === value;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
export function parseProgress(raw: string | null): Progress {
  const fresh = freshProgress();
  if (!raw) return fresh;
  try {
    const v = JSON.parse(raw);
    if (!v || v.version !== 1) return fresh;
    const entries = Object.entries(v.phrases ?? {}).filter(
      (entry): entry is [string, PhraseProgress] => {
        const q = entry[1] as PhraseProgress;
        return (
          q &&
          typeof q.seen === "boolean" &&
          Number.isInteger(q.level) &&
          q.level >= 0 &&
          q.level <= 3 &&
          validDay(q.due) &&
          (q.lastAttempt === null || validDay(q.lastAttempt))
        );
      },
    );
    const result: Progress = {
      ...fresh,
      phrases: Object.fromEntries(entries),
      completed: strings(v.completed) ? v.completed : [],
      letters: strings(v.letters) ? v.letters : [],
      checkedLetters: strings(v.checkedLetters)
        ? [...new Set<string>(v.checkedLetters)].filter((l) => /^[ა-ჰ]$/.test(l))
        : [],
      favorites: strings(v.favorites) ? v.favorites : [],
      activityDays: strings(v.activityDays)
        ? v.activityDays.filter(validDay)
        : [],
      immersion: typeof v.immersion === "boolean" ? v.immersion : true,
      theme: ["auto", "light", "dark"].includes(v.theme) ? v.theme : "auto",
      soundEffects:
        typeof v.soundEffects === "boolean"
          ? v.soundEffects
          : fresh.soundEffects,
      audioVolume:
        typeof v.audioVolume === "number" && Number.isFinite(v.audioVolume)
          ? Math.min(1, Math.max(0.1, v.audioVolume))
          : fresh.audioVolume,
    };
    const a = v.active;
    if (
      a &&
      typeof a.lessonId === "string" &&
      Number.isInteger(a.index) &&
      a.index >= 0 &&
      strings(a.correct) &&
      strings(a.errors) &&
      (a.reviewIds === undefined || strings(a.reviewIds))
    )
      result.active = a;
    return result;
  } catch {
    return fresh;
  }
}
export function encounter(
  p: Progress,
  id: string,
  today = localDay(),
): Progress {
  if (p.phrases[id]) return p;
  return {
    ...p,
    phrases: {
      ...p.phrases,
      [id]: { seen: true, level: 0, due: today, lastAttempt: null },
    },
  };
}
export function answer(
  p: Progress,
  id: string,
  correct: boolean,
  today = localDay(),
): Progress {
  const seen = encounter(p, id, today),
    current = seen.phrases[id];
  // Repeating a lesson on the same day cannot manufacture mastery.
  if (correct && current.lastAttempt === today) return seen;
  const level = correct ? Math.min(current.level + 1, 3) : 0;
  return {
    ...seen,
    activityDays: [...new Set([...seen.activityDays, today])],
    phrases: {
      ...seen.phrases,
      [id]: {
        ...current,
        level,
        due: correct ? addDays(today, [1, 1, 3, 7][level]) : today,
        lastAttempt: today,
      },
    },
  };
}
export function streak(days: string[], today = localDay()): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : addDays(today, -1),
    n = 0;
  while (set.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}
export function complete(
  p: Progress,
  lessonId: string,
  today = localDay(),
): Progress {
  return {
    ...p,
    active: undefined,
    completed:
      lessonId === "review"
        ? p.completed
        : [...new Set([...p.completed, lessonId])],
    activityDays: [...new Set([...p.activityDays, today])],
  };
}

export function confirmLetterPractice(p: Progress, letters: string[]): Progress {
  return { ...p, checkedLetters: [...new Set([...p.checkedLetters, ...letters])] };
}

export function assemblyHint(p: Progress, stepId: string): Progress {
  if (!p.active) return p;
  return { ...p, active: { ...p.active, errors: [...new Set([...p.active.errors, stepId])] } };
}

export function assemblyAnswer(
  p: Progress,
  stepId: string,
  phraseId: string,
  correct: boolean,
  today = localDay(),
): Progress {
  const active = p.active;
  if (!active) return p;
  const assisted = active.errors.includes(stepId);
  const updated = answer(p, phraseId, correct && !assisted, today);
  return {
    ...updated,
    active: {
      ...active,
      correct: correct && !assisted ? [...new Set([...active.correct, stepId])] : active.correct,
      errors: correct ? active.errors : [...new Set([...active.errors, stepId])],
    },
  };
}
