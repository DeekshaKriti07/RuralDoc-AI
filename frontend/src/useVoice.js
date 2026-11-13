import { useState, useRef, useEffect, useCallback } from "react";

export const LANGS = [
  { code: "en-IN", name: "English", native: "English",
    sym: "Tell me what you're feeling. I'll help you understand it and find the right next step.",
    chat: "Hi! Ask me any general health question. For your own symptoms, please use the Symptom Check." },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी",
    sym: "बताइए आपको क्या महसूस हो रहा है। मैं समझने और सही अगला कदम चुनने में आपकी मदद करूँगा।",
    chat: "नमस्ते! कोई भी सामान्य स्वास्थ्य सवाल पूछिए। अपने लक्षणों के लिए कृपया सिम्पटम चेक इस्तेमाल करें।" },
  { code: "ta-IN", name: "Tamil", native: "தமிழ்",
    sym: "உங்களுக்கு என்ன உணர்கிறது என்று சொல்லுங்கள். அதைப் புரிந்துகொள்ளவும் சரியான அடுத்த படியைத் தேர்வு செய்யவும் நான் உதவுகிறேன்.",
    chat: "வணக்கம்! பொதுவான உடல்நலக் கேள்வி எதுவாக இருந்தாலும் கேளுங்கள். உங்கள் அறிகுறிகளுக்கு அறிகுறி சோதனையைப் பயன்படுத்துங்கள்." },
  { code: "te-IN", name: "Telugu", native: "తెలుగు",
    sym: "మీకు ఏమి అనిపిస్తోందో చెప్పండి. దాన్ని అర్థం చేసుకోవడానికి, సరైన తదుపరి అడుగు వేయడానికి నేను సహాయం చేస్తాను.",
    chat: "నమస్కారం! ఏదైనా సాధారణ ఆరోగ్య ప్రశ్న అడగండి. మీ లక్షణాల కోసం దయచేసి సింప్టమ్ చెక్ ఉపయోగించండి." },
  { code: "kn-IN", name: "Kannada", native: "ಕನ್ನಡ",
    sym: "ನಿಮಗೆ ಏನು ಅನಿಸುತ್ತಿದೆ ಎಂದು ಹೇಳಿ. ಅದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ಸರಿಯಾದ ಮುಂದಿನ ಹೆಜ್ಜೆ ಇಡಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    chat: "ನಮಸ್ಕಾರ! ಯಾವುದೇ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆ ಕೇಳಿ. ನಿಮ್ಮ ಲಕ್ಷಣಗಳಿಗಾಗಿ ದಯವಿಟ್ಟು ಸಿಂಪ್ಟಮ್ ಚೆಕ್ ಬಳಸಿ." },
  { code: "ml-IN", name: "Malayalam", native: "മലയാളം",
    sym: "നിങ്ങൾക്ക് എന്താണ് തോന്നുന്നതെന്ന് പറയൂ. അത് മനസ്സിലാക്കാനും ശരിയായ അടുത്ത ഘട്ടം തിരഞ്ഞെടുക്കാനും ഞാൻ സഹായിക്കാം.",
    chat: "നമസ്കാരം! ഏതൊരു പൊതു ആരോഗ്യ ചോദ്യവും ചോദിക്കൂ. നിങ്ങളുടെ ലക്ഷണങ്ങൾക്ക് സിംപ്റ്റം ചെക്ക് ഉപയോഗിക്കൂ." },
  { code: "bn-IN", name: "Bengali", native: "বাংলা",
    sym: "আপনার কেমন লাগছে বলুন। আমি বুঝতে এবং সঠিক পরবর্তী পদক্ষেপ নিতে সাহায্য করব।",
    chat: "নমস্কার! যেকোনো সাধারণ স্বাস্থ্যের প্রশ্ন করুন। নিজের উপসর্গের জন্য সিম্পটম চেক ব্যবহার করুন।" },
  { code: "mr-IN", name: "Marathi", native: "मराठी",
    sym: "तुम्हाला काय वाटत आहे ते सांगा. ते समजून घेण्यात आणि योग्य पुढचे पाऊल निवडण्यात मी मदत करेन.",
    chat: "नमस्कार! कोणताही सामान्य आरोग्य प्रश्न विचारा. तुमच्या लक्षणांसाठी कृपया सिम्पटम चेक वापरा." },
  { code: "gu-IN", name: "Gujarati", native: "ગુજરાતી",
    sym: "તમને શું લાગે છે તે કહો. હું તેને સમજવામાં અને સાચું આગળનું પગલું લેવામાં મદદ કરીશ.",
    chat: "નમસ્તે! કોઈપણ સામાન્ય આરોગ્ય પ્રશ્ન પૂછો. તમારા લક્ષણો માટે કૃપા કરીને સિમ્પ્ટમ ચેક વાપરો." },
  { code: "pa-IN", name: "Punjabi", native: "ਪੰਜਾਬੀ",
    sym: "ਦੱਸੋ ਤੁਹਾਨੂੰ ਕੀ ਮਹਿਸੂਸ ਹੋ ਰਿਹਾ ਹੈ। ਮੈਂ ਇਸਨੂੰ ਸਮਝਣ ਅਤੇ ਸਹੀ ਅਗਲਾ ਕਦਮ ਚੁਣਨ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ।",
    chat: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਕੋਈ ਵੀ ਆਮ ਸਿਹਤ ਸਵਾਲ ਪੁੱਛੋ। ਆਪਣੇ ਲੱਛਣਾਂ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਸਿੰਪਟਮ ਚੈੱਕ ਵਰਤੋ।" },
];

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const synth = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

const norm = (c) => String(c).replace("_", "-").toLowerCase();

function guessLang() {
  const b = norm(navigator.language || "en").split("-")[0];
  return (LANGS.find((l) => l.code.split("-")[0] === b) || LANGS[0]).code;
}

function loadVoices() {
  return new Promise((res) => {
    if (!synth) return res([]);
    let n = 0;
    const t = () => {
      const v = synth.getVoices();
      if (v.length || n++ > 15) res(v);
      else setTimeout(t, 150);
    };
    t();
  });
}

function pickVoice(voices, code) {
  const c = norm(code), base = c.split("-")[0];
  const exact = voices.filter((v) => norm(v.lang) === c);
  const same = voices.filter((v) => norm(v.lang).split("-")[0] === base);
  const pool = exact.length ? exact : same;
  return pool.find((v) => /google|neural|natural|premium|enhanced/i.test(v.name)) || pool[0] || null;
}

// Chrome stops long utterances after ~15s, so speak in short chunks.
function chunk(text) {
  const parts = text.match(/[^.!?।॥\n]+[.!?।॥]*/g) || [text];
  const out = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > 170 && cur) { out.push(cur.trim()); cur = p; } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const clean = (t) => String(t).replace(/[*_#`>~]/g, "").replace(/\s+/g, " ").trim();

function installHint(name) {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return `Install ${name} voice data: Settings → Languages → Text-to-speech → Google Speech Services → Install voice data.`;
  if (/iPhone|iPad/i.test(ua)) return `Install a ${name} voice: Settings → Accessibility → Spoken Content → Voices.`;
  if (/Mac/i.test(ua)) return `On Mac: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → download a ${name} voice, then restart the browser.`;
  if (/Windows/i.test(ua)) return `On Windows: Settings → Time & language → Speech → Add voices → ${name}, then restart the browser.`;
  return `Install a ${name} text-to-speech voice in your device settings, then restart the browser.`;
}

export function useVoice() {
  const [lang, setLangState] = useState(() => localStorage.getItem("rd_lang") || guessLang());
  const [autoSpeak, setAutoState] = useState(() => localStorage.getItem("rd_auto") !== "0");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [speakingId, setSpeakingId] = useState(null);
  const [voiceReady, setVoiceReady] = useState(true);
  const rec = useRef(null);
  const token = useRef(0);
  const keep = useRef([]);
  const info = LANGS.find((l) => l.code === lang) || LANGS[0];

  const stopSpeak = useCallback(() => { token.current++; synth?.cancel(); setSpeakingId(null); }, []);
  const stop = useCallback(() => { try { rec.current?.stop(); } catch { /* ignore */ } }, []);

  const setLang = useCallback((c) => {
    stopSpeak();
    try { rec.current?.abort(); } catch { /* ignore */ }
    setError("");
    localStorage.setItem("rd_lang", c);
    setLangState(c);
  }, [stopSpeak]);

  const setAutoSpeak = (v) => {
    localStorage.setItem("rd_auto", v ? "1" : "0");
    setAutoState(v);
    if (!v) stopSpeak();
  };

  useEffect(() => {
    if (!synth) { setVoiceReady(false); return; }
    let on = true;
    const check = () => loadVoices().then((v) => on && setVoiceReady(!!pickVoice(v, lang)));
    check();
    synth.addEventListener?.("voiceschanged", check);
    return () => { on = false; synth.removeEventListener?.("voiceschanged", check); };
  }, [lang]);

  useEffect(() => () => {
    token.current++;
    synth?.cancel();
    try { rec.current?.abort(); } catch { /* ignore */ }
  }, []);

  const speak = useCallback(async (text, id = "x", langOverride) => {
    if (!synth || !text) return;
    const my = ++token.current;
    synth.cancel();
    const voice = pickVoice(await loadVoices(), langOverride || lang);
    if (my !== token.current) return;
    if (!voice) { if (!langOverride) setVoiceReady(false); return; }
    const parts = chunk(clean(text));
    if (!parts.length) return;
    setSpeakingId(id);
    keep.current = parts.map((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.voice = voice; u.lang = voice.lang; u.rate = 0.95;
      const done = () => { if (token.current === my && i === parts.length - 1) setSpeakingId(null); };
      u.onend = done; u.onerror = done;
      return u;
    });
    setTimeout(() => { if (token.current === my) keep.current.forEach((u) => synth.speak(u)); }, 80);
  }, [lang]);

  const start = useCallback((onFinal) => {
    setError("");
    if (!SR) { setError("Voice input isn't supported in this browser. Please use Google Chrome or Microsoft Edge."); return; }
    stopSpeak();
    try { rec.current?.abort(); } catch { /* ignore */ }
    const r = new SR();
    r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
    let finalText = "", failed = false;
    r.onstart = () => { setListening(true); setInterim(""); };
    r.onresult = (e) => {
      let live = "";
      finalText = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript + " "; else live += res[0].transcript;
      }
      setInterim((finalText + live).trim());
    };
    r.onerror = (e) => {
      failed = true;
      if (e.error === "aborted") return;
      const nm = (LANGS.find((l) => l.code === lang) || LANGS[0]).name;
      const blocked = "Microphone access is blocked. Click the lock icon in the address bar and allow the microphone.";
      const map = {
        "not-allowed": blocked, "service-not-allowed": blocked,
        "no-speech": "I didn't hear anything. Tap the mic and speak again.",
        "audio-capture": "No microphone was found on this device.",
        network: "Voice input needs an internet connection (Chrome processes speech online).",
        "language-not-supported": `This browser can't recognise ${nm} speech. Try Google Chrome.`,
      };
      setError(map[e.error] || `Voice input error (${e.error}).`);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
      const t = finalText.trim();
      if (t) onFinal?.(t);
      else if (!failed) setError("I couldn't catch that. Tap the mic and try again.");
    };
    rec.current = r;
    try { r.start(); } catch { setError("Couldn't start the microphone. Please try again."); }
  }, [lang, stopSpeak]);

  const voiceHelp = !synth
    ? "Voice output isn't supported in this browser."
    : !voiceReady
      ? `No ${info.name} voice is installed on this device, so replies can't be read aloud. ${installHint(info.name)}`
      : "";

  return {
    lang, setLang, info, autoSpeak, setAutoSpeak,
    listening, interim, error, start, stop,
    speak, stopSpeak, speakingId, canSpeak: !!synth && voiceReady, voiceHelp,
  };
}