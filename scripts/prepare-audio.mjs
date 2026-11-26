import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { phrases, lessons, alphabet } from "../src/data/lessons.ts";
const texts = new Set(phrases.map((p) => p.ka));
for (const lesson of lessons)
  for (const step of lesson.steps)
    if ((step.type === "quiz" || step.type === "sign") && step.speaker) texts.add(step.speaker);
for (const letter of alphabet) texts.add(letter.word);
const manifest = Array.from(texts, (text) => ({
  text,
  spokenText: text,
  file: `${createHash("sha256").update(text).digest("hex").slice(0, 16)}.mp3`,
}));
await mkdir(new URL("../public/audio/ka/", import.meta.url), {
  recursive: true,
});
await writeFile(
  new URL("../public/audio/ka/manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  new URL("../src/data/audio-clips.ts", import.meta.url),
  `// Generated from lessons.ts. Georgian originals only.\nexport const audioClips: Record<string,string> = ${JSON.stringify(Object.fromEntries(manifest.map((m) => [m.text, `/audio/ka/${m.file}`])), null, 2)};\n`,
);
process.stdout.write(`Prepared ${manifest.length} Georgian audio clips.\n`);
