# Russian synthesized speech

The MP3 files in `ru/` are generated locally from the Russian translations and lesson prompts in this project. They are synthetic speech, not recordings of a Georgian speaker and not Georgian pronunciation examples.

Generator: [Piper TTS (OHF-Voice)](https://github.com/OHF-Voice/piper1-gpl), version 1.8.0, run as a build-time tool. The engine and voice model are not shipped with this web application.

Voice: [ru_RU-denis-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/ru/ru_RU/denis/medium). The voice model repository identifies the model license as MIT; the voice-specific [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/ru/ru_RU/denis/medium/MODEL_CARD) identifies the dataset as CC0.

The interface chimes are original oscillator sequences synthesized in the browser. No Duolingo sound assets are used.
