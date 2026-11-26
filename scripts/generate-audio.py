"""Generate speech assets: python scripts/generate-audio.py /path/to/model.onnx [ka]"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import wave
import onnxruntime
onnxruntime.disable_telemetry_events()
from piper import PiperVoice, SynthesisConfig

root=Path(__file__).resolve().parents[1]
language=sys.argv[2] if len(sys.argv)>2 else 'ka'
if language != 'ka':
    raise SystemExit('Only Georgian audio is supported')
target=root/'public/audio'/language
manifest=json.loads((target/'manifest.json').read_text())
voice=PiperVoice.load(sys.argv[1])
config=SynthesisConfig(length_scale=1.02,noise_scale=.55,noise_w_scale=.65)
for index,item in enumerate(manifest):
    output=target/item['file']
    if output.exists() and output.stat().st_size>1000:
        continue
    with tempfile.TemporaryDirectory(prefix='karguli-voice-') as tmp:
        wav=Path(tmp)/'line.wav'
        with wave.open(str(wav),'wb') as stream:
            voice.synthesize_wav(item['spokenText'],stream,syn_config=config)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar','24000','-codec:a','libmp3lame','-b:a','64k',str(output)],check=True)
    print(f"{index+1}/{len(manifest)}",flush=True)
print('Audio assets generated.',flush=True)
