import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { phrases, lessons, alphabet } from "../src/data/lessons.ts";
const texts = new Set(["Здравствуйте! Давайте познакомимся."]);
for (const phrase of phrases) texts.add(phrase.ru);
for (const lesson of lessons)
  for (const step of lesson.steps)
    if (step.type !== "study") {
      texts.add(step.prompt);
      if (step.speakerTranslation) texts.add(step.speakerTranslation);
    }
const georgian = new Set(phrases.map((p) => p.ka));
for (const lesson of lessons)
  for (const step of lesson.steps)
    if (step.type !== "study" && step.speaker) georgian.add(step.speaker);
for (const letter of alphabet) georgian.add(letter.word);
const clips = {};
for (const [lang, collection] of [
  ["ru", texts],
  ["ka", georgian],
]) {
  const manifest = Array.from(collection, (text) => ({
    text,
    spokenText: text.replaceAll(" / ", ". "),
    file: `${createHash("sha256").update(text).digest("hex").slice(0, 16)}.mp3`,
  }));
  await mkdir(new URL(`../public/audio/${lang}/`, import.meta.url), {
    recursive: true,
  });
  await writeFile(
    new URL(`../public/audio/${lang}/manifest.json`, import.meta.url),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  for (const item of manifest) clips[item.text] = `/audio/${lang}/${item.file}`;
  process.stdout.write(`Prepared ${manifest.length} ${lang} audio clips.\n`);
}
await writeFile(
  new URL("../src/data/audio-clips.ts", import.meta.url),
  `// Generated from lessons.ts by scripts/prepare-audio.mjs. Georgian originals and Russian translations.\nexport const audioClips: Record<string,string> = ${JSON.stringify(clips, null, 2)};\n`,
);
