import { LoaderCircle, Square, Volume2 } from "lucide-react";
import {
  appAudio,
  speechKey,
  type PlaybackState,
  type SpeechLine,
} from "../lib/audio";

export function SpeechButton({
  lines,
  label,
  state,
  rate,
  volume,
  showTranscript = false,
}: {
  lines: SpeechLine[];
  label: string;
  state: PlaybackState;
  rate: number;
  volume: number;
  showTranscript?: boolean;
}) {
  const mine = state.key === speechKey(lines),
    playing =
      mine && (state.status === "speaking" || state.status === "loading");
  return (
    <div className="speech-control">
      <button
        className={`speech-button ${playing ? "playing" : ""}`}
        onClick={() => void appAudio.speak(lines, rate, volume)}
        aria-label={playing ? "Остановить озвучку" : label}
        aria-pressed={playing}
      >
        {playing ? (
          state.status === "loading" ? (
            <LoaderCircle size={18} className="spin" />
          ) : (
            <Square size={16} fill="currentColor" />
          )
        ) : (
          <Volume2 size={19} />
        )}
        {playing ? "Остановить" : label}
        <span className="speech-lang">
          {lines.every((l) => l.lang === "ka-GE") ? "KA" : "RU"}
        </span>
      </button>
      {showTranscript && (
        <div className="dialogue-transcript">
          {lines.map((line, i) => (
            <div
              key={i}
              className={mine && state.index === i ? "speaking" : ""}
            >
              <span>{line.role}</span>
              <p lang={line.lang === "ka-GE" ? "ka" : "ru"}>{line.text}</p>
              {mine && state.index === i && state.status === "speaking" && (
                <span className="voice-wave" aria-label="Сейчас звучит">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {mine && state.status === "error" && (
        <p className="speech-error" role="status">
          {state.error}
        </p>
      )}
    </div>
  );
}
