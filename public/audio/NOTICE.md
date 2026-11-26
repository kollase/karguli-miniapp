# Synthesized Georgian and Russian speech

The MP3 files in `ru/` and `ka/` are generated locally from this project's Russian translations/prompts and Georgian originals. These are synthetic voices. Georgian pronunciation has not yet been reviewed by a teacher or native-speaking editor.

Generator: [Piper TTS (OHF-Voice)](https://github.com/OHF-Voice/piper1-gpl), version 1.8.0, run as a build-time tool. The engine and voice model are not shipped with this web application.

Voice: [ru_RU-denis-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/ru/ru_RU/denis/medium). The voice model repository identifies the model license as MIT; the voice-specific [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/ru/ru_RU/denis/medium/MODEL_CARD) identifies the dataset as CC0.

Georgian voice: [ka_GE-natia-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/ka/ka_GE/natia/medium). The model repository is labeled MIT; the voice-specific [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/ka/ka_GE/natia/medium/MODEL_CARD) refers to the upstream RHVoice LICENSE for the dataset, without spelling out those terms. This notice records provenance, not a claim that all upstream terms have been independently cleared for commercial distribution.

The interface chimes are original oscillator sequences synthesized in the browser. No Duolingo sound assets are used.
