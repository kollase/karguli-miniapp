import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  Flame,
  Flower2,
  Heart,
  Info,
  Leaf,
  MapPin,
  Moon,
  PanelTop,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Truck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  alphabet,
  lessons,
  phraseById,
  phrases,
  scenarios,
  type AlphabetLetter,
  type Lesson,
  type Phrase,
  type ScenarioId,
  type Step,
} from "./data/lessons";
import {
  exerciseAnswer,
  exerciseHint,
  complete,
  confirmLetterPractice,
  encounter,
  freshProgress,
  localDay,
  parseProgress,
  STORAGE_KEY,
  streak,
  type Progress,
} from "./lib/progress";
import { haptic, telegram } from "./lib/telegram";
import { appAudio, type PlaybackState } from "./lib/audio";
import { SpeechButton } from "./components/SpeechButton";
import { AlphabetTrainer } from "./components/AlphabetTrainer";
import { PhraseBuilder } from "./components/PhraseBuilder";
import { alphabetPair } from "./lib/alphabet";

type Page = "learn" | "cheat" | "alphabet" | "lesson";
const scenarioIcons = {
  basics: Flower2,
  delivery: Truck,
  cafe: Coffee,
  market: ShoppingBag,
  signs: PanelTop,
};
const navItems = [
  { id: "learn", label: "Учиться", icon: BookOpen },
  { id: "cheat", label: "Шпаргалка", icon: Bookmark },
  { id: "alphabet", label: "Алфавит", icon: Sparkles },
] as const;
function CityIllustration() {
  return (
    <svg
      className="city-art"
      viewBox="0 0 520 330"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="408" cy="67" r="34" fill="#ecc872" />
      <path
        d="M12 287Q120 224 227 272T514 256"
        stroke="#adc3ae"
        strokeWidth="2"
      />
      <path
        d="M69 295V118L150 65 228 118V295"
        fill="#e8b3a0"
        stroke="#784b49"
        strokeWidth="2"
      />
      <path
        d="M56 119L150 55 242 119"
        stroke="#784b49"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M222 295V159L322 101 420 159V295"
        fill="#f4dfb7"
        stroke="#784b49"
        strokeWidth="2"
      />
      <path
        d="M211 160L322 90 433 160"
        stroke="#784b49"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M255 184H390V230H255Z"
        fill="#adc3ae"
        stroke="#784b49"
        strokeWidth="2"
      />
      <path
        d="M245 224H401V240H245Z"
        fill="#e1b48d"
        stroke="#784b49"
        strokeWidth="2"
      />
      {[267, 290, 313, 336, 359, 382].map((x) => (
        <path key={x} d={`M${x} 224v16`} stroke="#784b49" strokeWidth="2" />
      ))}
      {[99, 172].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 178v-35a17 17 0 0 1 34 0v35Z`}
            fill="#7d8c78"
            stroke="#784b49"
            strokeWidth="2"
          />
          <path
            d={`M${x + 17} 127v51M${x} 153h34`}
            stroke="#f9e7ce"
            strokeWidth="2"
          />
        </g>
      ))}
      <path
        d="M83 187H219V207H83Z"
        fill="#f1ceaf"
        stroke="#784b49"
        strokeWidth="2"
      />
      {[90, 108, 126, 144, 162, 180, 198, 212].map((x) => (
        <path key={x} d={`M${x} 187v20`} stroke="#784b49" strokeWidth="2" />
      ))}
      <path
        d="M99 295v-53a24 24 0 0 1 48 0v53"
        fill="#7d293d"
        stroke="#784b49"
        strokeWidth="2"
      />
      <path
        d="M178 239h29v39h-29z"
        fill="#7d8c78"
        stroke="#784b49"
        strokeWidth="2"
      />
      <path d="M284 295v-32h74v32" fill="#7d293d" />
      <path d="M278 258h86" stroke="#784b49" strokeWidth="4" />
      <text
        x="321"
        y="215"
        textAnchor="middle"
        fill="#314c3b"
        fontSize="23"
        fontFamily="sans-serif"
      >
        გამარჯობა
      </text>
      <path
        d="M446 300V201m0 43c-46-2-39-49-24-38m24 57c45-8 47-52 27-50"
        stroke="#5e7f62"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse
        cx="426"
        cy="204"
        rx="13"
        ry="25"
        fill="#729471"
        transform="rotate(-28 426 204)"
      />
      <ellipse
        cx="466"
        cy="219"
        rx="13"
        ry="25"
        fill="#729471"
        transform="rotate(25 466 219)"
      />
      <path d="M425 301h41l-5 22h-31z" fill="#b56c4e" />
      <path
        d="M23 302h470"
        stroke="#784b49"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M269 66q12-10 24 0m0 0q12-10 24 0"
        stroke="#784b49"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="52" cy="192" r="4" fill="#7d293d" />
      <path d="M45 192h14m-7-7v14" stroke="#7d293d" strokeWidth="2" />
    </svg>
  );
}
function Modal({
  children,
  onClose,
  label,
  showMode = false,
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  showMode?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "Tab") {
        const all = ref.current?.querySelectorAll<HTMLElement>(
          'button,input,a,[tabindex="0"]',
        );
        if (!all?.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`modal-backdrop ${showMode ? "show-backdrop" : ""}`}
      onClick={onClose}
    >
      <div
        className={`modal ${showMode ? "show-modal" : ""}`}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={23} />
        </button>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [progress, setProgress] = useState<Progress>(() => {
    try {
      return parseProgress(localStorage.getItem(STORAGE_KEY));
    } catch {
      return freshProgress();
    }
  });
  const [page, setPage] = useState<Page>("learn"),
    [scenario, setScenario] = useState<ScenarioId | null>(null),
    [shown, setShown] = useState<Phrase | null>(null),
    [letter, setLetter] = useState<AlphabetLetter | null>(null),
    [trainingLetters, setTrainingLetters] = useState<string[] | null>(null),
    [info, setInfo] = useState(false),
    [audioOpen, setAudioOpen] = useState(false),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false),
    [storageError, setStorageError] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [letterFilter, setLetterFilter] = useState("Все"),
    [showTranscription, setShowTranscription] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [result, setResult] = useState<{
      correct: number;
      total: number;
      letters: string[];
      review: boolean;
    } | null>(null),
    [clock, setClock] = useState(() => localDay());
  const [playback, setPlayback] = useState<PlaybackState>({
    key: "",
    status: "idle",
    index: -1,
    error: "",
  });
  useEffect(() => appAudio.subscribe(setPlayback), []);
  useEffect(() => {
    appAudio.configure(progress.soundEffects, progress.audioVolume);
  }, [progress.soundEffects, progress.audioVolume]);
  useEffect(() => {
    appAudio.stop();
  }, [
    page,
    progress.active?.lessonId,
    progress.active?.index,
    audioOpen,
    shown,
    info,
    scenario,
    letter,
    trainingLetters,
  ]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) appAudio.silence();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      appAudio.silence();
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  useEffect(() => {
    const update = () => setClock(localDay());
    window.addEventListener("focus", update);
    const id = setInterval(update, 30000);
    return () => {
      window.removeEventListener("focus", update);
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    const app = telegram();
    const applyTheme = () => {
      const dark =
        progress.theme === "dark" ||
        (progress.theme === "auto" &&
          (app?.colorScheme === "dark" ||
            (!app && matchMedia("(prefers-color-scheme: dark)").matches)));
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.dataset.telegram = app ? "true" : "false";
      for (const [key, val] of Object.entries(app?.themeParams ?? {}))
        document.documentElement.style.setProperty(
          `--tg-theme-${key.replaceAll("_", "-")}`,
          val,
        );
    };
    applyTheme();
    app?.ready();
    app?.expand();
    app?.onEvent("themeChanged", applyTheme);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", applyTheme);
    return () => {
      app?.offEvent("themeChanged", applyTheme);
      mq.removeEventListener("change", applyTheme);
    };
  }, [progress.theme]);
  const closeModal = () => {
    setShown(null);
    setLetter(null);
    setTrainingLetters(null);
    setScenario(null);
    setInfo(false);
    setAudioOpen(false);
    setCopied(false);
    setCopyError(false);
  };
  const back = () => {
    if (shown || letter || trainingLetters || scenario || info || audioOpen) closeModal();
    else if (page === "lesson") {
      setPage("learn");
      setResult(null);
      setSelected(null);
      setShowTranscription(false);
    } else setPage("learn");
  };
  useEffect(() => {
    const button = telegram()?.BackButton;
    if (!button) return;
    const visible =
      page !== "learn" ||
      !!shown ||
      !!letter ||
      !!trainingLetters ||
      !!scenario ||
      info ||
      audioOpen;
    visible ? button.show() : button.hide();
    button.onClick(back);
    return () => button.offClick(back);
  });
  const known = Object.keys(progress.phrases).filter((id) => phraseById[id]),
    mastered = known.filter((id) => progress.phrases[id].level >= 2),
    due = known.filter((id) => progress.phrases[id].due <= clock);
  const active = progress.active;
  const currentLesson = lessons.find((l) => l.id === active?.lessonId);
  const reviewSteps: Step[] = (active?.reviewIds ?? [])
    .filter((id) => phraseById[id])
    .map((id) => ({
      id: `review-${id}`,
      type: phraseById[id].scenario === "signs" ? "sign" : "quiz",
      phraseId: id,
      prompt:
        phraseById[id].scenario === "signs"
          ? "Что написано на вывеске?"
          : `Как сказать: «${phraseById[id].ru}»?`,
      options: [
        id,
        ...phrases
          .filter((p) => p.scenario === phraseById[id].scenario && p.id !== id)
          .slice(0, 2)
          .map((p) => p.id),
      ],
      explanation: phraseById[id].hint,
    }));
  const steps =
    active?.lessonId === "review" ? reviewSteps : (currentLesson?.steps ?? []);
  const step = steps[active?.index ?? 0];
  const start = (lesson: Lesson) => {
    void appAudio.effect("tap");
    setProgress((p) => ({
      ...p,
      active: { lessonId: lesson.id, index: 0, correct: [], errors: [] },
    }));
    setSelected(null);
    setShowTranscription(false);
    setResult(null);
    setScenario(null);
    setPage("lesson");
    window.scrollTo(0, 0);
  };
  const resume = () => {
    if (active && steps.length && active.index < steps.length) {
      setResult(null);
      setSelected(null);
      setShowTranscription(false);
      setPage("lesson");
    } else
      start(
        lessons.find((l) => !progress.completed.includes(l.id)) ?? lessons[0],
      );
  };
  const startReview = () => {
    if (!due.length) return;
    setProgress((p) => ({
      ...p,
      active: {
        lessonId: "review",
        index: 0,
        correct: [],
        errors: [],
        reviewIds: due.slice(0, 10),
      },
    }));
    setResult(null);
    setSelected(null);
    setShowTranscription(false);
    setPage("lesson");
    window.scrollTo(0, 0);
  };
  const next = () => {
    if (!active || !step) return;
    appAudio.stop();
    void appAudio.effect(active.index + 1 >= steps.length ? "complete" : "tap");
    let p = progress;
    if (step.type === "study") p = encounter(p, step.phraseId);
    if (active.index + 1 >= steps.length) {
      const letters = currentLesson?.letters.some((l) => !p.checkedLetters.includes(l))
        ? currentLesson.letters
        : [];
      setResult({
        correct: active.correct.length,
        total: steps.filter((s) => s.type !== "study").length,
        letters,
        review: active.lessonId === "review",
      });
      setProgress(complete(p, active.lessonId));
    } else
      setProgress({ ...p, active: { ...active, index: active.index + 1 } });
    setSelected(null);
    setShowTranscription(false);
    window.scrollTo(0, 0);
  };
  const choose = (id: string) => {
    if (selected || !active || !step) return;
    const correct = id === step.phraseId;
    appAudio.stop();
    void appAudio.effect(correct ? "correct" : "incorrect");
    haptic(correct);
    setSelected(id);
    setProgress((p) => exerciseAnswer(p, step.id, step.phraseId, correct));
  };
  const favorite = (id: string) =>
    setProgress((p) => ({
      ...p,
      favorites: p.favorites.includes(id)
        ? p.favorites.filter((v) => v !== id)
        : [...p.favorites, id],
    }));
  const copy = async () => {
    if (!shown) return;
    try {
      await navigator.clipboard.writeText(shown.ka);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  const navigate = (p: Page) => {
    setPage(p);
    setResult(null);
    setSelected(null);
    setShowTranscription(false);
    window.scrollTo(0, 0);
  };
  function Georgian({
    text,
    large = false,
  }: {
    text: string;
    large?: boolean;
  }) {
    return (
      <span
        lang="ka"
        className={large ? "georgian large-georgian" : "georgian"}
      >
        {Array.from(text).map((char, i) =>
          progress.immersion && progress.checkedLetters.includes(char) ? (
            <button
              key={i}
              className="known-letter"
              aria-label={`Буква ${char}`}
              onClick={() =>
                setLetter(alphabet.find((a) => a.letter === char) ?? null)
              }
            >
              {char}
            </button>
          ) : (
            <span key={i}>{char}</span>
          ),
        )}
      </span>
    );
  }
  const daily =
    phrases[new Date(`${clock}T12:00:00`).getDate() % phrases.length];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("learn");
          }}
        >
          <span className="brand-mark" lang="ka">
            კ
          </span>
          <span>
            каргули<small>грузинский для жизни</small>
          </span>
        </a>
        <div className="sidebar-caption">МАЛЕНЬКИМИ ШАГАМИ</div>
        <nav aria-label="Основная навигация">
          {navItems.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id || (page === "lesson" && n.id === "learn") ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={21} />
              {n.label}
              {n.id === "cheat" && (
                <span className="nav-count">{phrases.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={27} />
          <p>
            Новый город.
            <br />
            Понемногу — свой.
          </p>
          <span>Без спешки и сложных правил.</span>
        </div>
        <div className="sidebar-bottom">
          <span>Сделано с теплом к Грузии</span>
          <button className="text-button" onClick={() => setInfo(true)}>
            О приложении <Info size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="mobile-brand">
            <span lang="ka">კ</span> каргули
          </span>
          <div className="place">
            <MapPin size={17} /> Где бы вы ни были в Грузии
          </div>
          <div className="topbar-actions">
            <span className="streak">
              <Flame size={18} />
              {streak(progress.activityDays, clock)} <span>дн. подряд</span>
            </span>
            <button
              className={`icon-button sound-settings-trigger ${progress.soundEffects ? "sound-on" : ""}`}
              onClick={() => setAudioOpen(true)}
              aria-label="Настройки звука"
              title="Настройки звука"
            >
              {progress.soundEffects ? (
                <Volume2 size={20} />
              ) : (
                <VolumeX size={20} />
              )}
            </button>
            <button
              className="icon-button"
              aria-label={`Тема: ${progress.theme === "auto" ? "системная" : progress.theme === "light" ? "светлая" : "тёмная"}. Переключить тему`}
              title="Переключить тему"
              onClick={() =>
                setProgress((p) => ({
                  ...p,
                  theme:
                    p.theme === "auto"
                      ? "dark"
                      : p.theme === "dark"
                        ? "light"
                        : "auto",
                }))
              }
            >
              {progress.theme === "dark" ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )}
            </button>
            <button
              className="icon-button mobile-info"
              onClick={() => setInfo(true)}
              aria-label="О приложении"
            >
              <Info size={20} />
            </button>
          </div>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            Не удалось сохранить прогресс на устройстве. Проверьте доступность
            хранилища браузера.
          </div>
        )}
        <main>
          {page === "learn" && (
            <>
              <div className="page-intro">
                <div>
                  <div className="eyebrow">გამარჯობა · ГАМАРДЖОБА</div>
                  <h1>
                    С каждым словом —<br />
                    немного ближе.
                  </h1>
                  <p>Грузинский для обычной жизни. По паре минут в день.</p>
                </div>
                <span className="intro-stamp">
                  <Flower2 size={38} />
                  <span>
                    გამარჯობა,
                    <br />
                    новый день
                  </span>
                </span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="tag">
                    <span className="tiny-dot" /> МАЛЕНЬКИЙ УРОК. БОЛЬШОЙ ШАГ.
                  </span>
                  <h2>
                    {active
                      ? "Продолжим знакомство?"
                      : "Первое слово —\nуже начало."}
                  </h2>
                  <p>
                    {active
                      ? "Ваш урок сохранён. Вернитесь к нему, когда будет удобно."
                      : "Поздороваться с соседом, поблагодарить бариста. Начнём с того, что пригодится сегодня."}
                  </p>
                  <button className="primary-button" onClick={resume}>
                    {active
                      ? "Продолжить урок"
                      : progress.completed.length
                        ? "Следующий урок"
                        : "Начать знакомство"}
                    <span className="button-time">2–3 мин</span>
                  </button>
                  <span className="hero-footnote">
                    <Check size={14} /> Можно без звука. В своём темпе.
                  </span>
                </div>
                <CityIllustration />
              </section>
              <section className="stats" aria-label="Ваш прогресс">
                <div>
                  <span className="stat-icon rose">
                    <BookOpen size={21} />
                  </span>
                  <div>
                    <strong>
                      {known.length}
                      <span> / {phrases.length}</span>
                    </strong>
                    <p>фраз встретили</p>
                  </div>
                </div>
                <div>
                  <span className="stat-icon green">
                    <CheckCheck size={21} />
                  </span>
                  <div>
                    <strong>{mastered.length}</strong>
                    <p>фраз закрепили</p>
                  </div>
                </div>
                <div>
                  <span className="stat-icon yellow">
                    <span lang="ka">ა</span>
                  </span>
                  <div>
                    <strong>
                      {progress.checkedLetters.length}
                      <span> / 33</span>
                    </strong>
                    <p>букв проверили</p>
                  </div>
                </div>
              </section>
              <section className="scenario-section">
                <div className="section-heading">
                  <div>
                    <h2>На все случаи дня</h2>
                    <p>Выберите, что пригодится именно вам.</p>
                  </div>
                  <span className="section-meta">5 сценариев · 10 уроков</span>
                </div>
                <div className="scenario-grid">
                  {scenarios.map((s, i) => {
                    const Icon = scenarioIcons[s.id];
                    const completed = lessons.filter(
                      (l) =>
                        l.scenarioId === s.id &&
                        progress.completed.includes(l.id),
                    ).length;
                    return (
                      <button
                        className={`scenario-card ${s.color}`}
                        key={s.id}
                        onClick={() => setScenario(s.id)}
                      >
                        <div className="card-top">
                          <span className="scenario-icon">
                            <Icon size={29} strokeWidth={1.6} />
                          </span>
                          <span className="card-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <span className="card-label">{s.label}</span>
                        <h3>{s.title}</h3>
                        <p>{s.subtitle}</p>
                        <div className="card-bottom">
                          <span>
                            {completed === 2
                              ? "Пройдено · можно повторить"
                              : `${completed} из 2 уроков`}
                          </span>
                          <span className="card-open">
                            <ChevronRight size={19} />
                          </span>
                        </div>
                        <div className="card-progress">
                          <span style={{ width: `${completed * 50}%` }} />
                        </div>
                      </button>
                    );
                  })}
                  <button
                    className="review-card"
                    onClick={due.length ? startReview : () => navigate("cheat")}
                  >
                    <span className="review-icon">
                      <RotateCcw size={27} />
                    </span>
                    <span className="card-label">ЧТОБЫ ОСТАЛОСЬ С ВАМИ</span>
                    <h3>
                      {due.length ? "Знакомое — ещё раз" : "Слова под рукой"}
                    </h3>
                    <p>
                      {due.length
                        ? `К повторению: ${due.length}. Вспомним без подсказок?`
                        : "Все нужные фразы уже в шпаргалке. Даже до первого урока."}
                    </p>
                    <span className="review-link">
                      {due.length ? "Повторить сегодня" : "Открыть шпаргалку"}
                      <ChevronRight size={18} />
                    </span>
                  </button>
                </div>
              </section>
              <section className="daily-phrase">
                <span className="daily-icon">
                  <Coffee size={25} />
                </span>
                <div>
                  <div className="eyebrow">ОДНА ФРАЗА НА СЕГОДНЯ</div>
                  <span className="daily-georgian" lang="ka">
                    {daily.ka}
                  </span>
                  <span className="daily-translation">{daily.ru}</span>
                </div>
                <button
                  className="icon-button"
                  onClick={() => {
                    setShown(daily);
                    setCopied(false);
                  }}
                  aria-label="Показать фразу дня"
                >
                  <PanelTop size={23} />
                </button>
              </section>
              <footer className="page-footer">
                <span>Каждое «мадлоба» делает город чуть роднее.</span>
                <span lang="ka">ნელ-ნელა ♡</span>
              </footer>
            </>
          )}
          {page === "cheat" && (
            <>
              <div className="page-intro compact">
                <div>
                  <div className="eyebrow">КОГДА СЛОВА НУЖНЫ ПРЯМО СЕЙЧАС</div>
                  <h1>Покажите. Вас поймут.</h1>
                  <p>
                    Нажмите на фразу, чтобы показать её крупно или скопировать.
                  </p>
                </div>
                <Bookmark className="intro-icon" size={44} />
              </div>
              <label className="search-field">
                <Search size={21} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Найти: картой, курьер, спасибо…"
                  aria-label="Поиск фраз"
                />
                {search && (
                  <button
                    className="icon-button"
                    aria-label="Очистить поиск"
                    onClick={() => setSearch("")}
                  >
                    <X size={18} />
                  </button>
                )}
              </label>
              <div className="filter-row">
                {[
                  { id: "all", label: "Все фразы" },
                  {
                    id: "favorites",
                    label: `Избранное · ${progress.favorites.length}`,
                  },
                  { id: "basics", label: "Языковой барьер" },
                  { id: "delivery", label: "Курьер и такси" },
                  { id: "cafe", label: "Кофейня" },
                  { id: "market", label: "Магазин" },
                  { id: "signs", label: "Вывески" },
                ].map((f) => (
                  <button
                    className={`filter-chip ${filter === f.id ? "selected" : ""}`}
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.id === "favorites" && <Heart size={15} />} {f.label}
                  </button>
                ))}
              </div>
              <div className="phrase-grid">
                {phrases
                  .filter(
                    (p) =>
                      (filter === "all" ||
                        (filter === "favorites" &&
                          progress.favorites.includes(p.id)) ||
                        p.scenario === filter) &&
                      `${p.ru} ${p.ka} ${p.pronunciation}`
                        .toLowerCase()
                        .includes(search.toLowerCase().trim()),
                  )
                  .map((p) => (
                    <article className="phrase-card" key={p.id}>
                      <button
                        className="phrase-open"
                        onClick={() => {
                          setShown(p);
                          setCopied(false);
                          setCopyError(false);
                        }}
                      >
                        <span className="phrase-category">
                          {scenarios.find((s) => s.id === p.scenario)?.label}
                        </span>
                        <h3>{p.ru}</h3>
                        <span lang="ka" className="phrase-ka">
                          {p.ka}
                        </span>
                        <span className="phrase-pronunciation">
                          {p.pronunciation}
                        </span>
                      </button>
                      <button
                        className={`icon-button favorite ${progress.favorites.includes(p.id) ? "is-favorite" : ""}`}
                        aria-label={`${progress.favorites.includes(p.id) ? "Убрать из избранного" : "В избранное"}: ${p.ru}`}
                        onClick={() => favorite(p.id)}
                      >
                        <Heart
                          size={20}
                          fill={
                            progress.favorites.includes(p.id)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                      <div className="phrase-audio">
                        <SpeechButton
                          lines={[{ text: p.ka, lang: "ka-GE" }]}
                          label="Послушать"
                          state={playback}
                          volume={progress.audioVolume}
                        />
                      </div>
                    </article>
                  ))}
              </div>
              {!phrases.some(
                (p) =>
                  (filter === "all" ||
                    (filter === "favorites" &&
                      progress.favorites.includes(p.id)) ||
                    p.scenario === filter) &&
                  `${p.ru} ${p.ka} ${p.pronunciation}`
                    .toLowerCase()
                    .includes(search.toLowerCase().trim()),
              ) && (
                <div className="empty-state">
                  <Search size={35} />
                  <h2>
                    {filter === "favorites" && !progress.favorites.length
                      ? "Ваши любимые фразы будут здесь"
                      : "Пока ничего не нашли"}
                  </h2>
                  <p>
                    {filter === "favorites" && !progress.favorites.length
                      ? "Нажмите на сердечко рядом с нужной фразой."
                      : "Попробуйте другое слово или откройте все фразы."}
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                  >
                    Все фразы
                  </button>
                </div>
              )}
            </>
          )}
          {page === "alphabet" && (
            <>
              <div className="page-intro compact">
                <div>
                  <div className="eyebrow">
                    ЗНАКОМЫЕ БУКВЫ В НЕЗНАКОМОМ ГОРОДЕ
                  </div>
                  <h1>Постепенно станет понятно.</h1>
                  <p>
                    33 буквы. Знакомьтесь с ними через слова и короткие уроки.
                  </p>
                </div>
                <span className="alphabet-big" lang="ka">
                  ა
                </span>
              </div>
              <div className="alphabet-summary">
                <div>
                  <Sparkles size={25} />
                  <strong>{progress.checkedLetters.length} из 33 букв проверено</strong>
                </div>
                <p>
                  Цветом отмечены буквы, которые вы узнали в двух проверках. Это
                  первый шаг к чтению, а не оценка владения алфавитом.
                </p>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${(progress.checkedLetters.length / 33) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <button className="primary-button alphabet-start" onClick={() => {
                const nextLetter = alphabet.find((a) => !progress.checkedLetters.includes(a.letter)) ?? alphabet[0];
                setTrainingLetters(alphabetPair(nextLetter.letter));
              }}>
                {progress.checkedLetters.length ? "Продолжить практику букв" : "Начать с двух букв"}
              </button>
              <div className="filter-row">
                {[
                  "Все",
                  "Гласные",
                  "Согласные",
                  "Придыхательные",
                  "Абруптивные",
                ].map((f) => (
                  <button
                    key={f}
                    className={`filter-chip ${letterFilter === f ? "selected" : ""}`}
                    onClick={() => setLetterFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="alphabet-grid">
                {alphabet
                  .filter(
                    (a) => letterFilter === "Все" || a.group === letterFilter,
                  )
                  .map((a) => (
                    <button
                      key={a.letter}
                      className={`letter-card ${progress.checkedLetters.includes(a.letter) ? "unlocked" : ""}`}
                      onClick={() => setLetter(a)}
                      aria-label={`Буква ${a.letter}: ${a.sound}. ${progress.checkedLetters.includes(a.letter) ? "Проверена" : "Познакомиться"}`}
                    >
                      <span lang="ka">{a.letter}</span>
                      <small>
                        {a.sound.length > 20 ? "особый звук" : a.sound}
                      </small>
                      {progress.checkedLetters.includes(a.letter) && (
                        <Check size={14} />
                      )}
                    </button>
                  ))}
              </div>
              <div className="gentle-note">
                <Info size={21} />
                <p>
                  Русские обозначения звуков приблизительны. Придыхательные и
                  абруптивные согласные требуют отдельной практики произношения.
                </p>
              </div>
            </>
          )}
          {page === "lesson" &&
            (result ? (
              <section className="result-screen">
                <div className="result-flower">
                  <Flower2 size={70} strokeWidth={1.2} />
                </div>
                <div className="eyebrow">ЕЩЁ ОДИН МАЛЕНЬКИЙ ШАГ</div>
                <h1>
                  {result.review
                    ? "Знакомые слова — ближе."
                    : "Сегодня вы стали чуть ближе."}
                </h1>
                <p>
                  Самостоятельно с первой попытки: {result.correct} из {result.total}.
                  <br />
                  {result.correct < result.total
                    ? "Фразы с ошибками или подсказками остались в повторении."
                    : "Вернитесь завтра: проверим, что осталось в памяти."}
                </p>
                {!!result.letters.length && (
                  <div className="new-letters">
                    <span>Теперь познакомимся с буквами?</span>
                    <div>
                      {result.letters.map((l) => (
                        <button
                          key={l}
                          lang="ka"
                          onClick={() => setTrainingLetters(result.letters)}
                          aria-label={`Потренировать буквы ${result.letters.join(" и ")}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <p>Ещё один маленький шаг: посмотрите, как звучат эти буквы, и попробуйте узнать их.</p>
                    <button className="primary-button" onClick={() => setTrainingLetters(result.letters)}>Буквы: знакомство и проверка</button>
                  </div>
                )}
                <button
                  className="primary-button"
                  onClick={() => navigate("learn")}
                >
                  Вернуться к сценариям
                </button>
                <button
                  className="text-button"
                  onClick={() => navigate("cheat")}
                >
                  Посмотреть шпаргалку
                </button>
              </section>
            ) : active && step ? (
              <section className="lesson-screen">
                <div className="lesson-toolbar">
                  <button
                    className="icon-button"
                    onClick={back}
                    aria-label="Сохранить и выйти из урока"
                  >
                    <ChevronLeft />
                  </button>
                  <span>
                    {active.lessonId === "review"
                      ? "Повторение"
                      : scenarios.find(
                          (s) => s.id === currentLesson?.scenarioId,
                        )?.title}
                  </span>
                  <button
                    className={`immersion-toggle ${progress.immersion ? "on" : ""}`}
                    onClick={() =>
                      setProgress((p) => ({ ...p, immersion: !p.immersion }))
                    }
                    aria-pressed={progress.immersion}
                  >
                    <span lang="ka">ა</span> <span>Подсветка букв</span>
                    <i />
                  </button>
                </div>
                <div className="lesson-progress">
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(active.index / steps.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span>
                    {active.index + 1} / {steps.length}
                  </span>
                </div>
                <div className="lesson-card" key={step.id}>
                  <span className="step-tag">
                    {step.type === "study"
                      ? "ЗНАКОМИМСЯ С ФРАЗОЙ"
                      : step.type === "sign"
                        ? "РАСШИФРУЙТЕ ВЫВЕСКУ"
                        : step.type === "assemble"
                          ? "СОБЕРИТЕ ФРАЗУ"
                          : "ВАША ОЧЕРЕДЬ ОТВЕТИТЬ"}
                  </span>
                  {step.type === "study" ? (
                    <>
                      <div className="study-situation">
                        {phraseById[step.phraseId].ru}
                      </div>
                      <Georgian text={phraseById[step.phraseId].ka} large />
                      <p className="study-pronunciation">
                        {phraseById[step.phraseId].pronunciation}
                      </p>
                      <div className="speech-pair">
                        <SpeechButton
                          lines={[
                            {
                              text: phraseById[step.phraseId].ka,
                              lang: "ka-GE",
                            },
                          ]}
                          label="По-грузински"
                          state={playback}
                          volume={progress.audioVolume}
                        />
                      </div>
                      <div className="culture-hint">
                        <Leaf size={23} />
                        <p>{phraseById[step.phraseId].hint}</p>
                      </div>
                      <div className="study-bottom">
                        <span>Прочитайте. Представьте ситуацию.</span>
                        <button
                          className={`icon-button ${progress.favorites.includes(step.phraseId) ? "is-favorite" : ""}`}
                          onClick={() => favorite(step.phraseId)}
                          aria-label="Сохранить фразу в избранное"
                        >
                          <Heart
                            size={21}
                            fill={
                              progress.favorites.includes(step.phraseId)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>
                    </>
                  ) : step.type === "assemble" ? (
                    <PhraseBuilder
                      key={step.id}
                      phrase={phraseById[step.phraseId]}
                      chunks={step.chunks}
                      stepId={step.id}
                      state={playback}
                      volume={progress.audioVolume}
                      assisted={active.errors.includes(step.id)}
                      onHint={() => setProgress((p) => exerciseHint(p, step.id))}
                      onAttempt={(correct) => {
                        setProgress((p) => exerciseAnswer(p, step.id, step.phraseId, correct));
                        setSelected(correct ? step.phraseId : null);
                      }}
                    />
                  ) : (
                    <>
                      <h2 className="quiz-prompt">{step.prompt}</h2>
                      {step.type === "sign" && (
                        <div className="street-sign" lang="ka">
                          {phraseById[step.phraseId].ka}
                        </div>
                      )}
                      {step.type === "quiz" && step.speaker && (
                        <div className="dialogue-bubble">
                          <span className="phrase-category">СОБЕСЕДНИК</span>
                          <p lang="ka">{step.speaker}</p>
                          <small>{step.speakerTranslation}</small>
                          <SpeechButton
                            lines={[
                              {
                                text: step.speaker,
                                lang: "ka-GE",
                                role: "Собеседник",
                              },
                            ]}
                            label="Реплика по-грузински"
                            state={playback}
                            volume={progress.audioVolume}
                          />
                        </div>
                      )}

                      {step.type === "quiz" && (
                        <button
                          className="transcription-toggle"
                          aria-expanded={showTranscription}
                          aria-controls="quiz-answer-options"
                          onClick={() => {
                            if (!showTranscription && !selected) {
                              setProgress((p) => exerciseHint(p, step.id));
                            }
                            setShowTranscription((shown) => !shown);
                          }}
                        >
                          <BookOpen size={17} aria-hidden="true" />
                          {showTranscription ? "Скрыть транскрипцию" : "Показать транскрипцию"}
                        </button>
                      )}
                      <div className="answer-options" id="quiz-answer-options">
                        {[...step.options]
                          .sort((a, b) => {
                            const hash = (s: string) =>
                              Array.from(s + step.id).reduce(
                                (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
                                7,
                              );
                            return hash(a) - hash(b);
                          })
                          .map((id, i) => {
                            const p = phraseById[id],
                              correct = id === step.phraseId;
                            return (
                              <button
                                key={id}
                                disabled={!!selected}
                                className={`answer-option ${selected && (correct ? "correct" : id === selected ? "incorrect" : "muted")}`}
                                onClick={() => choose(id)}
                              >
                                <span className="option-index">{i + 1}</span>
                                <span>
                                  <span lang={step.type === "sign" ? "ru" : "ka"}>
                                    {step.type === "sign" ? p.ru : p.ka}
                                  </span>
                                  {step.type === "quiz" && showTranscription && (
                                    <span className="option-pronunciation" lang="ru">
                                      {p.pronunciation}
                                    </span>
                                  )}
                                </span>
                                {selected && correct && <Check size={21} />}
                              </button>
                            );
                          })}
                      </div>
                      {selected && (
                        <div
                          className={`answer-feedback ${selected === step.phraseId ? "success" : "retry"}`}
                          role="status"
                        >
                          <strong>
                            {selected === step.phraseId
                              ? active.errors.includes(step.id)
                                ? "Верно, с подсказкой!"
                                : "Да, именно так!"
                              : "Теперь будет легче вспомнить"}
                          </strong>
                          <p>
                            {phraseById[step.phraseId].ru} ·{" "}
                            {phraseById[step.phraseId].pronunciation}
                          </p>
                          <p>{step.explanation}</p>
                          <SpeechButton
                            lines={[
                              ...(step.speaker
                                ? [
                                    {
                                      text: step.speaker,
                                      lang: "ka-GE" as const,
                                      role: "Собеседник",
                                    },
                                  ]
                                : []),
                              {
                                text: phraseById[step.phraseId].ka,
                                lang: "ka-GE",
                                role: "Вы",
                              },
                            ]}
                            label={
                              step.speaker
                                ? "Диалог по-грузински"
                                : "Ответ по-грузински"
                            }
                            showTranscript
                            state={playback}
                            volume={progress.audioVolume}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="lesson-next">
                  <span>
                    {step.type === "study"
                      ? "Сначала послушайте, затем попробуйте повторить"
                      : step.type === "assemble"
                        ? selected ? "Получилось. Послушайте фразу ещё раз." : "Соберите фразу и нажмите «Проверить»"
                        : selected
                          ? selected === step.phraseId
                            ? active.errors.includes(step.id)
                              ? "Фразу ещё закрепим в повторении"
                              : "Получилось. Можно идти дальше."
                            : "Ошибаться — часть знакомства"
                          : "Выберите один ответ"}
                  </span>
                  <button
                    className="primary-button"
                    disabled={step.type !== "study" && !selected}
                    onClick={next}
                  >
                    {active.index === steps.length - 1
                      ? "Завершить"
                      : step.type === "study"
                        ? "Запомнили? Дальше"
                        : "Продолжить"}
                  </button>
                </div>
              </section>
            ) : (
              <div className="empty-state">
                <h2>Урок уже завершён</h2>
                <button
                  className="primary-button"
                  onClick={() => navigate("learn")}
                >
                  К сценариям
                </button>
              </div>
            ))}
        </main>
      </div>
      {page !== "lesson" && (
        <nav className="bottom-nav" aria-label="Мобильная навигация">
          {navItems.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={22} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      )}
      {scenario && (
        <Modal onClose={closeModal} label="Уроки сценария">
          <span
            className={`modal-scenario-icon ${scenarios.find((s) => s.id === scenario)?.color}`}
          >
            {(() => {
              const Icon = scenarioIcons[scenario];
              return <Icon size={33} />;
            })()}
          </span>
          <div className="eyebrow">ВАШ СЛЕДУЮЩИЙ МАЛЕНЬКИЙ ШАГ</div>
          <h2>{scenarios.find((s) => s.id === scenario)?.title}</h2>
          <p className="modal-description">
            Два коротких урока. В каждом — четыре фразы и практика.
          </p>
          <div className="lesson-picker">
            {lessons
              .filter((l) => l.scenarioId === scenario)
              .map((l) => (
                <button key={l.id} onClick={() => start(l)}>
                  <span className="lesson-part">
                    {progress.completed.includes(l.id) ? (
                      <Check size={21} />
                    ) : (
                      l.part
                    )}
                  </span>
                  <span>
                    <strong>{l.title}</strong>
                    <small>4 фразы · 2–3 минуты</small>
                  </span>
                  <ChevronRight size={20} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {shown && (
        <Modal onClose={closeModal} label={`Показать: ${shown.ru}`} showMode>
          <span className="show-label">ПОКАЖИТЕ СОБЕСЕДНИКУ</span>
          <div className="show-text" lang="ka">
            {shown.ka}
          </div>
          <div className="show-controls">
            <p>{shown.ru}</p>
            <button className="primary-button" onClick={copy}>
              {copied ? <Check size={20} /> : <Copy size={20} />}{" "}
              {copied ? "Скопировано" : "Скопировать текст"}
            </button>
            <span role="status">
              {copyError
                ? "Не удалось скопировать. Выделите грузинский текст и скопируйте вручную."
                : copied
                  ? "Можно вставить в чат."
                  : "Копируется только грузинский текст."}
            </span>
          </div>
        </Modal>
      )}
      {letter && (
        <Modal onClose={closeModal} label={`Буква ${letter.letter}`}>
          <span className="letter-modal-symbol" lang="ka">
            {letter.letter}
          </span>
          <span className="tag">
            {progress.checkedLetters.includes(letter.letter)
              ? "ПЕРВАЯ ПРОВЕРКА ПРОЙДЕНА"
              : "ПОЗНАКОМИМСЯ?"}
          </span>
          <h2>{letter.sound}</h2>
          <p className="letter-group">{letter.group}</p>
          <div className="letter-example">
            <span lang="ka">{Array.from(letter.word).map((char, i) => char === letter.letter ? <mark key={i}>{char}</mark> : char)}</span>
            <span>{letter.meaning}</span>
          </div>
          <SpeechButton
            lines={[{ text: letter.word, lang: "ka-GE" }]}
            label="Послушать слово"
            state={playback}
            volume={progress.audioVolume}
          />
          <p className="modal-description">
            {["ღ", "ყ", "ჰ"].includes(letter.letter)
              ? "У этого звука нет точного русского аналога. Текстовая подсказка поможет узнать букву, но не заменит практику произношения."
              : "Обозначение звука на русском — подсказка для начала. Ищите эту букву в знакомых грузинских словах."}
          </p>
          <button className="primary-button" onClick={() => {
            setTrainingLetters(alphabetPair(letter.letter));
            setLetter(null);
          }}>Потренировать эту букву</button>
        </Modal>
      )}
      {trainingLetters && (
        <Modal onClose={closeModal} label="Практика букв">
          <AlphabetTrainer
            key={trainingLetters.join("")}
            letters={trainingLetters}
            state={playback}
            volume={progress.audioVolume}
            onComplete={(checked) => setProgress((p) => confirmLetterPractice(p, checked))}
            onClose={closeModal}
          />
        </Modal>
      )}
      {info && (
        <Modal onClose={closeModal} label="О Каргули">
          <div className="brand-mark info-brand" lang="ka">
            კ
          </div>
          <h2>Каргули</h2>
          <p className="modal-description">
            Грузинский для жизни: короткие фразы, знакомые вывески и немного
            уверенности каждый день.
          </p>
          <div className="info-block">
            <strong>Учебный прототип</strong>
            <p>
              40 фраз и 10 микроуроков. Контент пока не прошёл редактуру
              преподавателем грузинского. Кириллическая запись приблизительна;
              приложение не проверяет произношение.
            </p>
            <strong>Ваш прогресс — на устройстве</strong>
            <p>
              Урок, избранное и повторения сохраняются в браузере. После очистки
              данных они исчезнут. Синхронизации между устройствами пока нет.
            </p>
            <strong>Когда фраза закреплена?</strong>
            <p>
              После двух верных ответов в разные дни. Ошибки возвращаются в
              повторение; просмотр карточки сам по себе не считается знанием.
            </p>
          </div>
        </Modal>
      )}
      {audioOpen && (
        <Modal onClose={closeModal} label="Настройки звука">
          <span className="audio-modal-icon">
            <Volume2 size={33} />
          </span>
          <div className="eyebrow">НЕМНОГО БОЛЬШЕ ЖИЗНИ</div>
          <h2>У каждого шага свой звук</h2>
          <p className="modal-description">
            Мягкие сигналы для ответов и маленькая мелодия в конце урока. Речь —
            только по вашему нажатию.
          </p>
          <div className="audio-settings">
            <label className="audio-setting-row">
              <span>
                <strong>Звуки урока</strong>
                <small>Ответы, переходы и завершение</small>
              </span>
              <input
                type="checkbox"
                checked={progress.soundEffects}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  appAudio.configure(enabled, progress.audioVolume);
                  if (enabled) void appAudio.effect("correct");
                  setProgress((p) => ({ ...p, soundEffects: enabled }));
                }}
              />
            </label>
            <label className="audio-volume">
              <span>
                Громкость{" "}
                <strong>{Math.round(progress.audioVolume * 100)}%</strong>
              </span>
              <input
                aria-label="Громкость звука"
                type="range"
                min="10"
                max="100"
                step="5"
                value={Math.round(progress.audioVolume * 100)}
                onChange={(e) => {
                  appAudio.stop();
                  setProgress((p) => ({
                    ...p,
                    audioVolume: Number(e.target.value) / 100,
                  }));
                }}
              />
            </label>
            <div className="audio-test-buttons">
              <button
                className="secondary-button"
                disabled={!progress.soundEffects}
                onClick={() => {
                  appAudio.stop();
                  void appAudio.effect("complete");
                }}
              >
                Проверить сигналы
              </button>
              <SpeechButton
                lines={[{ text: "გამარჯობა", lang: "ka-GE" }]}
                label="Грузинский голос"
                state={playback}
                volume={progress.audioVolume}
              />
            </div>
          </div>
          <div className="audio-note">
            <Info size={19} />
            <p>
              Слушайте грузинский голос Natia в обычном темпе. Черепашка рядом
              повторит ту же фразу медленнее, на скорости 0,75×. Произношение
              синтезированных записей ещё должен проверить преподаватель.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
