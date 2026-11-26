import { LoaderCircle, Square, Turtle, Volume2 } from "lucide-react";
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
  volume,
  showTranscript = false,
}: {
  lines: SpeechLine[];
  label: string;
  state: PlaybackState;
  volume: number;
  showTranscript?: boolean;
}) {
  const normal = state.key === speechKey(lines, 1),
    slow = state.key === speechKey(lines, 0.75),
    mine = normal || slow;
  const playing =
    mine && (state.status === "speaking" || state.status === "loading");
  return (
    <div className="speech-control">
      <div className="speech-actions">
        <button
          className={`speech-button ${playing && normal ? "playing" : ""}`}
          onClick={() => void appAudio.speak(lines, 1, volume)}
          aria-label={playing && normal ? "Остановить озвучку" : label}
          aria-pressed={playing && normal}
        >
          {playing && normal ? (
            state.status === "loading" ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Square size={16} fill="currentColor" />
            )
          ) : (
            <Volume2 size={19} />
          )}
          {playing && normal ? "Остановить" : label}
        </button>
        <button
          className={`slow-speech-button ${playing && slow ? "playing" : ""}`}
          onClick={() => void appAudio.speak(lines, 0.75, volume, true)}
          aria-label={`Повторить медленно: ${label}`}
          aria-pressed={playing && slow}
          title="Повторить медленно · 0,75×"
        >
          <Turtle size={24} strokeWidth={1.7} />
          <span>0,75×</span>
        </button>
        {playing && slow && (
          <button
            className="icon-button stop-slow"
            onClick={() => appAudio.stop()}
            aria-label="Остановить медленную озвучку"
          >
            <Square size={16} fill="currentColor" />
          </button>
        )}
      </div>
      {showTranscript && (
        <div className="dialogue-transcript">
          {lines.map((line, i) => (
            <div
              key={i}
              className={mine && state.index === i ? "speaking" : ""}
            >
              <span>{line.role}</span>
              <p lang="ka">{line.text}</p>
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
