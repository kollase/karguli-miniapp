import { alphabet, lessons, type AlphabetLetter } from "../data/lessons.ts";

export type LetterStep = {
  type: "study" | "sound" | "symbol";
  letter: AlphabetLetter;
  options: AlphabetLetter[];
};

export function alphabetPair(letter: string): string[] {
  const lesson = lessons.find((l) => l.letters.includes(letter));
  if (lesson) return lesson.letters;
  const index = alphabet.findIndex((a) => a.letter === letter);
  if (index < 0) return lessons[0].letters;
  return [letter, alphabet[(index + 1) % alphabet.length].letter];
}

export function letterPractice(letters: string[]): LetterStep[] {
  const pair = [...new Set(letters)].map((l) => alphabet.find((a) => a.letter === l));
  if (pair.length !== 2 || pair.some((a) => !a)) return [];
  const [a, b] = pair as AlphabetLetter[];
  return [
    { type: "study", letter: a, options: [] },
    { type: "study", letter: b, options: [] },
    { type: "sound", letter: a, options: [b, a] },
    { type: "symbol", letter: b, options: [b, a] },
    { type: "symbol", letter: a, options: [b, a] },
    { type: "sound", letter: b, options: [a, b] },
  ];
}

// Only successful recognition in both directions counts as a first check.
export function checkedInPractice(steps: LetterStep[], passed: number[]): string[] {
  const symbols = [...new Set(steps.map((s) => s.letter.letter))];
  return symbols.filter((symbol) => ["sound", "symbol"].every((type) =>
    steps.some((s, i) => s.letter.letter === symbol && s.type === type && passed.includes(i)),
  ));
}
