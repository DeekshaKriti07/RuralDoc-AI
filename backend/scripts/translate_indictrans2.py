#!/usr/bin/env python3
"""
Translate all RuralDoc text with AI4Bharat IndicTrans2 (better quality than a general chat model for Indian languages).
Works offline once the model has been downloaded one time.

Setup (once, with internet):
  pip install torch transformers sentencepiece
  pip install git+https://github.com/VarunGumma/IndicTransToolkit.git        # provides IndicProcessor
  (see the IndicTrans2 repo, huggingface_interface/ for details)
Run:
  node scripts/exportStrings.js
  python3 scripts/translate_indictrans2.py            # all languages
  python3 scripts/translate_indictrans2.py ta hi      # only some
Output: src/ai/knowledge/translations.json  (merged with anything already there)

NOTE: written against the IndicTrans2 huggingface_interface example; not run in the environment where it was written.
Native speakers should review safety-critical sentences (first aid, warning signs).
"""
import json, os, sys, torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit.processor import IndicProcessor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "ai", "knowledge", "translations.json")
CKPT = os.environ.get("INDICTRANS2_MODEL", "ai4bharat/indictrans2-en-indic-dist-200M")  # or ...-1B for best quality
CODES = {"hi": "hin_Deva", "ta": "tam_Taml", "te": "tel_Telu", "kn": "kan_Knda", "ml": "mal_Mlym",
         "bn": "ben_Beng", "mr": "mar_Deva", "gu": "guj_Gujr", "pa": "pan_Guru"}
BATCH = 8
device = "cuda" if torch.cuda.is_available() else "cpu"

langs = sys.argv[1:] or list(CODES)
strings = json.load(open(os.path.join(HERE, "static_strings.json"), encoding="utf-8"))
cache = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}

tok = AutoTokenizer.from_pretrained(CKPT, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(CKPT, trust_remote_code=True).to(device).eval()
ip = IndicProcessor(inference=True)

for code in langs:
    tgt = CODES[code]
    done = cache.setdefault(code, {})
    todo = [s for s in strings if s not in done]
    print(f"{code}: {len(todo)} sentences to translate on {device}")
    for i in range(0, len(todo), BATCH):
        batch = todo[i:i + BATCH]
        pre = ip.preprocess_batch(batch, src_lang="eng_Latn", tgt_lang=tgt)
        enc = tok(pre, truncation=True, padding="longest", return_tensors="pt").to(device)
        with torch.no_grad():
            gen = model.generate(**enc, use_cache=True, min_length=0, max_length=256, num_beams=5, num_return_sequences=1)
        out = tok.batch_decode(gen, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        out = ip.postprocess_batch(out, lang=tgt)
        for s, t in zip(batch, out):
            done[s] = t
        if (i // BATCH) % 10 == 0:
            json.dump(cache, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(cache, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{code}: saved")
print("Done:", OUT)
