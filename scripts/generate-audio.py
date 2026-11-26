"""Generate shipped speech assets. Usage: python scripts/generate-audio.py /path/to/model.onnx"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import wave
from piper import PiperVoice, SynthesisConfig
import onnxruntime

onnxruntime.disable_telemetry_events()

root=Path(__file__).resolve().parents[1]
target=root/'public/audio/ru'
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
