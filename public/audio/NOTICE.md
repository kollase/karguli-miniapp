# Synthesized Georgian speech

The MP3 files in `ka/` are generated locally from the Georgian originals in this project. These are synthetic speech samples; their pronunciation has not yet been reviewed by a teacher or native-speaking editor. Russian translations are text only.

Generator: [Piper TTS (OHF-Voice)](https://github.com/OHF-Voice/piper1-gpl), version 1.8.0, used as a build-time tool. The engine and model are not shipped with this web application.

Voice: [ka_GE-natia-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/ka/ka_GE/natia/medium). The model repository is labeled MIT. The voice-specific [model card](https://huggingface.co/rhasspy/piper-voices/blob/main/ka/ka_GE/natia/medium/MODEL_CARD) refers to the upstream RHVoice LICENSE for its dataset, without reproducing those terms. This records provenance and does not assert independent clearance of all upstream terms for commercial distribution.

Slow playback uses the same recording at 0.75× with pitch preservation. UI chimes are original oscillator sequences synthesized in the browser; no Duolingo sound assets are used.
