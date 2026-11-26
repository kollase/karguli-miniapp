import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { Phrase } from "../data/lessons";
import { chunkBank, matchesChunks } from "../lib/chunks";
import { appAudio, type PlaybackState } from "../lib/audio";
import { haptic } from "../lib/telegram";
import { SpeechButton } from "./SpeechButton";

export function PhraseBuilder({ phrase, chunks, stepId, state, volume, assisted, onHint, onAttempt }: {
  phrase: Phrase;
  chunks: string[];
  stepId: string;
  state: PlaybackState;
  volume: number;
  assisted: boolean;
  onHint: () => void;
  onAttempt: (correct: boolean) => void;
}) {
  const [bank] = useState(() => chunkBank(chunks, `${stepId}-${Math.random()}`));
  const [chosen, setChosen] = useState<number[]>([]);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "retry" | null>(null);
  const solved = feedback === "correct";
  const edit = (next: number[]) => {
    if (solved) return;
    appAudio.stop();
    setChosen(next);
    setFeedback(null);
    void appAudio.effect("tap");
  };
  const check = () => {
    if (solved || chosen.length !== chunks.length) return;
    const correct = matchesChunks(chunks, chosen);
    appAudio.stop();
    setFeedback(correct ? "correct" : "retry");
    haptic(correct);
    void appAudio.effect(correct ? "correct" : "incorrect");
    onAttempt(correct);
  };
  return <div className="phrase-builder">
    <h2 className="quiz-prompt">{phrase.ru}</h2>
    <p className="builder-instruction">Восстановите фразу из урока. Нажимайте на кусочки в нужном порядке.</p>
    <div className={`builder-answer ${solved ? "solved" : ""}`} role="group" aria-label="Ваша фраза">
      {!chosen.length && <span className="builder-placeholder">Здесь появится ваша фраза</span>}
      {chosen.map((id, index) => <button key={id} className="word-tile chosen-tile" lang="ka"
        aria-label={`Убрать кусочек ${index + 1}: ${chunks[id]}`}
        disabled={solved} onClick={() => edit(chosen.filter((value) => value !== id))}>
        {chunks[id]} {!solved && <X size={14} aria-hidden="true" />}
      </button>)}
    </div>
    <div className="builder-tools">
      <span aria-live="polite">{chosen.length} из {chunks.length} кусочков</span>
      <button className="text-button" disabled={solved || !chosen.length} onClick={() => edit([])}>
        <RotateCcw size={16} /> Начать заново
      </button>
    </div>
    <div className="builder-bank" role="group" aria-label="Кусочки фразы">
      {bank.map((tile) => <button key={tile.id} className={`word-tile ${chosen.includes(tile.id) ? "used-tile" : ""}`}
        disabled={solved || chosen.includes(tile.id)} lang="ka"
        aria-label={`Добавить: ${tile.text}`}
        onClick={() => edit([...chosen, tile.id])}>
        {tile.text}
      </button>)}
    </div>
    {!solved && <div className="builder-actions">
      <button className="primary-button" disabled={chosen.length !== chunks.length} onClick={check}>Проверить фразу</button>
      <button className="text-button" aria-expanded={hint} onClick={() => {
        if (!hint) onHint();
        setHint(!hint);
      }}>{hint ? "Скрыть подсказку" : "Подсказка: транслит и пример"}</button>
    </div>}
    {hint && !solved && <div className="builder-hint">
      <span lang="ka">{phrase.ka}</span>
      <p>{phrase.pronunciation}</p>
      <SpeechButton lines={[{ text: phrase.ka, lang: "ka-GE" }]} label="Послушать пример" state={state} volume={volume} />
    </div>}
    {feedback && <div className={`answer-feedback ${solved ? "success" : "retry"}`} role="status">
      <strong>{solved ? <><Check size={18} /> {assisted ? "Получилось! Вернёмся к фразе в повторениях." : "Фраза собрана!"}</> : "Порядок отличается от примера в уроке"}</strong>
      <p>{solved ? phrase.hint : "Нажмите на кусочек в своей фразе, чтобы вернуть его вниз, и попробуйте ещё раз."}</p>
      {solved && <>
        <p className="builder-pronunciation">{phrase.pronunciation}</p>
        <SpeechButton lines={[{ text: phrase.ka, lang: "ka-GE" }]} label="Послушать фразу" state={state} volume={volume} />
      </>}
    </div>}
  </div>;
}
