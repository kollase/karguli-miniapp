import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { phrases, lessons } from "../src/data/lessons.ts";
const texts = new Set(["Здравствуйте! Давайте познакомимся."]);
for (const phrase of phrases) texts.add(phrase.ru);
for (const lesson of lessons)
  for (const step of lesson.steps)
    if (step.type !== "study") {
      texts.add(step.prompt);
      if (step.speakerTranslation) texts.add(step.speakerTranslation);
    }
const manifest = Array.from(texts, (text) => ({
  text,
  spokenText: text.replaceAll(" / ", ". "),
  file: `${createHash("sha256").update(text).digest("hex").slice(0, 16)}.mp3`,
}));
await mkdir(new URL("../public/audio/ru/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL("../public/audio/ru/manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  new URL("../src/data/audio-clips.ts", import.meta.url),
  `// Generated from lessons.ts by scripts/prepare-audio.mjs. Russian translations only.\nexport const audioClips: Record<string,string> = ${JSON.stringify(Object.fromEntries(manifest.map((m) => [m.text, `/audio/ru/${m.file}`])), null, 2)};\n`,
);
process.stdout.write(`Prepared ${manifest.length} Russian audio clips.\n`);
