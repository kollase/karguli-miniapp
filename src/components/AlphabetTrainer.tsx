import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { letterPractice, checkedInPractice } from "../lib/alphabet";
import { appAudio, type PlaybackState } from "../lib/audio";
import { haptic } from "../lib/telegram";
import { SpeechButton } from "./SpeechButton";

export function AlphabetTrainer({ letters, state, volume, onComplete, onClose }: {
  letters: string[];
  state: PlaybackState;
  volume: number;
  onComplete: (letters: string[]) => void;
  onClose: () => void;
}) {
  const steps = letterPractice(letters);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [passed, setPassed] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const step = steps[index];
  useEffect(() => {
    appAudio.stop();
    return () => appAudio.stop();
  }, [index, done]);
  if (!step) return <p>Не удалось открыть практику. Выберите букву в алфавите.</p>;
  const a = step.letter;
  const study = step.type === "study";
  const correct = selected === a.letter;
  const advance = () => {
    if (!study && !correct) { setSelected(null); return; }
    const successful = correct ? [...new Set([...passed, index])] : passed;
    setPassed(successful);
    if (index === steps.length - 1) {
      const checked = checkedInPractice(steps, successful);
      if (checked.length !== letters.length) return;
      onComplete(checked);
      setDone(true);
      void appAudio.effect("complete");
    } else {
      setSelected(null);
      setIndex(index + 1);
      void appAudio.effect("tap");
    }
  };
  if (done) return <div className="alphabet-trainer">
    <CheckCheck size={42} className="practice-check" />
    <div className="eyebrow">ПЕРВАЯ ПРАКТИКА ПРОЙДЕНА</div>
    <h2>Вы узнали две буквы.</h2>
    <div className="practice-pair" lang="ka">{letters.join(" · ")}</div>
    <p>Вы сопоставили буквы со звуками в обе стороны. Это начало знакомства — вернитесь позже и проверьте себя ещё раз.</p>
    <button className="primary-button" onClick={onClose}>Готово</button>
  </div>;
  return <div className="alphabet-trainer">
    <div className="eyebrow">ДВЕ БУКВЫ ЗА ОДИН ШАГ</div>
    <div className="practice-progress" aria-label={`Шаг ${index + 1} из ${steps.length}`}>
      <div className="progress-track"><span style={{ width: `${index / steps.length * 100}%` }} /></div>
      <span>{index + 1} / {steps.length}</span>
    </div>
    <span className="step-tag">{study ? "СНАЧАЛА ПОЗНАКОМИМСЯ" : "ТЕПЕРЬ БЕЗ ПОДСКАЗКИ"}</span>
    <h2>{study ? "Буква и её звук" : step.type === "sound" ? "Какой звук у этой буквы?" : "Какая буква обозначает этот звук?"}</h2>
    {study || step.type === "sound"
      ? <div className="practice-symbol" lang="ka">{a.letter}</div>
      : <div className="practice-sound">«{a.sound}»</div>}
    {study && <>
      <p className="practice-sound">{a.letter} → «{a.sound}»</p>
      <p>Это подсказка о звуке, а не перевод буквы. Посмотрите, где она встречается в слове.</p>
      <div className="letter-example">
        <span lang="ka">{Array.from(a.word).map((char, i) => char === a.letter ? <mark key={i}>{char}</mark> : char)}</span>
        <span>{a.meaning}</span>
      </div>
      <SpeechButton lines={[{ text: a.word, lang: "ka-GE" }]} label="Послушать в слове" state={state} volume={volume} />
      <p className="practice-note">Русская запись приблизительна. Послушайте слово целиком; черепашка повторит его медленнее.</p>
    </>}
    {!study && <div className={`answer-options letter-options ${step.type === "symbol" ? "symbol-options" : ""}`}>
      {step.options.map((option) => <button key={option.letter}
        className={`answer-option ${selected ? option.letter === a.letter ? "correct" : option.letter === selected ? "incorrect" : "" : ""}`}
        disabled={!!selected}
        onClick={() => {
          const right = option.letter === a.letter;
          appAudio.stop();
          setSelected(option.letter);
          haptic(right);
          void appAudio.effect(right ? "correct" : "incorrect");
        }} lang={step.type === "symbol" ? "ka" : "ru"}>
        {step.type === "symbol" ? option.letter : option.sound}
      </button>)}
    </div>}
    {selected && <div className={`answer-feedback ${correct ? "" : "retry"}`} role="status">
      <strong>{correct ? "Верно" : "Посмотрите ещё раз"}: {a.letter} → «{a.sound}»</strong>
      {!correct && <p>Ошибаться можно. Запомните пару и попробуйте снова — буква пока не засчитана.</p>}
    </div>}
    <button className="primary-button practice-next" disabled={!study && !selected} onClick={advance}>
      {study ? index === 0 ? "Следующая буква" : "Проверить себя" : !correct && selected ? "Попробовать ещё" : index === steps.length - 1 ? "Завершить практику" : "Дальше"}
    </button>
  </div>;
}
