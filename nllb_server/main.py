import os
import time
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

app = FastAPI(
    title="SiteSync NLLB Translation Engine",
    description="High-performance self-hosted translation service powered by Facebook NLLB-200",
    version="1.0.0"
)

# NLLB Language Codes Mapping
LANG_MAP = {
    "uz": "uzn_Latn", # Uzbek (Latin)
    "ru": "rus_Cyrl", # Russian
    "en": "eng_Latn", # English
    "zh": "zho_Hans", # Simplified Chinese
}

MODEL_NAME = os.getenv("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")
NLLB_API_KEY = os.getenv("NLLB_API_KEY", "")

print(f"🔄 Loading NLLB Model ({MODEL_NAME})...")
start_time = time.time()

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

# Use GPU if available, fallback to CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

print(f"✅ Model loaded successfully on [{device.upper()}] in {time.time() - start_time:.2f}s")


class TranslationRequest(BaseModel):
    text: str
    source_lang: str  # 'uz', 'ru', 'en', 'zh'
    target_langs: List[str]  # e.g. ['ru', 'en', 'zh']


class TranslationResponse(BaseModel):
    source_lang: str
    translations: Dict[str, str]
    execution_time_ms: float


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": device,
        "model": MODEL_NAME
    }


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if NLLB_API_KEY and x_api_key != NLLB_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

@app.post("/translate", response_model=TranslationResponse, dependencies=[Depends(verify_api_key)])
def translate_text(req: TranslationRequest):
    if not req.text.strip():
        return TranslationResponse(
            source_lang=req.source_lang,
            translations={lang: "" for lang in req.target_langs},
            execution_time_ms=0.0
        )

    src_code = LANG_MAP.get(req.source_lang.lower())
    if not src_code:
        raise HTTPException(status_code=400, detail=f"Unsupported source language: {req.source_lang}")

    t0 = time.time()
    results = {}

    tokenizer.src_lang = src_code
    inputs = tokenizer(req.text, return_tensors="pt").to(device)

    for target_lang in req.target_langs:
        target_lang_clean = target_lang.lower()
        if target_lang_clean == req.source_lang.lower():
            results[target_lang_clean] = req.text
            continue

        tgt_code = LANG_MAP.get(target_lang_clean)
        if not tgt_code:
            results[target_lang_clean] = req.text
            continue

        forced_bos_token_id = tokenizer.convert_tokens_to_ids(tgt_code)

        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=forced_bos_token_id,
                max_length=512,
                num_beams=2,
                early_stopping=True
            )

        translated_text = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        results[target_lang_clean] = translated_text

    execution_time_ms = round((time.time() - t0) * 1000, 2)

    return TranslationResponse(
        source_lang=req.source_lang,
        translations=results,
        execution_time_ms=execution_time_ms
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
