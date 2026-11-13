// RURALDOC_MOTION_THEATER_V2: step-indexed 2D animations and existing regional narration.
import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api";
import { OFFLINE_FA_TRANSLATIONS } from "../data/faTranslations";


const flatten = (g) => [g.title, g.summary, g.call, ...g.steps.flatMap(([t, d]) => [t, d]), ...g.donts];
const unflatten = (g, a) => {
  let i = 0;
  const title = a[i++], summary = a[i++], call = a[i++];
  const steps = g.steps.map(([, , scene]) => ({ t: a[i++], d: a[i++], scene }));
  const donts = g.donts.map(() => a[i++]);
  return { title, summary, call, steps, donts };
};

const invalidated = new Set(['cpr', 'choking', 'bleeding', 'burns', 'heatstroke', 'allergic', 'asthma', 'lowsugar', 'nosebleed', 'ors', 'fever', 'eyeinjury']);;

// Returns guide text in chosen language (bundled offline translations > localStorage > backend AI > English)
function useGuideText(guide, langCode) {
  const base = (langCode || "en-IN").split("-")[0];
  const english = useMemo(() => flatten(guide), [guide]);
  const identity = `${base}:${guide.id}:${JSON.stringify(english)}`;
  const [st, setSt] = useState({ identity: null, texts: null, status: "loading" });

  useEffect(() => {
    let live = true;
    const valid = texts => Array.isArray(texts) && texts.length === english.length && texts.every(t => typeof t === "string");
    const done = (texts, status) => { if (live) setSt({ identity, texts, status }); };
    if (base === "en") { done(null, "english"); return () => { live = false; }; }
    const bundled = OFFLINE_FA_TRANSLATIONS[`${base}_${guide.id}`];
    if (!invalidated.has(guide.id) && valid(bundled)) {
      done(bundled, "ready"); return () => { live = false; };
    }
    const key = `rd_fa_motion_v2_${base}_${guide.id}`;
    try {
      const cache = JSON.parse(localStorage.getItem(key) || "null");
      if (cache?.identity === identity && valid(cache.texts)) {
        done(cache.texts, "ready"); return () => { live = false; };
      }
    } catch { /* storage may be unavailable */ }
    done(null, "loading");
    apiRequest("/ai/translate", { method: "POST", body: JSON.stringify({ language: base, texts: english }) })
      .then(r => {
        if (!live) return;
        if (r.complete && valid(r.texts)) {
          try { localStorage.setItem(key, JSON.stringify({ identity, texts: r.texts })); } catch { /* ignore */ }
          done(r.texts, "ready");
        } else done(null, "english");
      }).catch(() => done(null, "english"));
    return () => { live = false; };
  }, [identity, base, guide.id, english]);
  const current = st.identity === identity ? st : { texts: null, status: base === "en" ? "english" : "loading" };
  return { ...unflatten(guide, current.texts || english), status: current.status };
}

export default function FirstAidPlayer({ guide, voice, onBack }) {
  const g = useGuideText(guide, voice.lang);
  const stopSpeak = voice.stopSpeak;
  useEffect(() => () => stopSpeak(), [guide.id, stopSpeak]);
  const language = g.status === "ready" ? voice.lang : "en-IN";
  return <div className="ap-page">
    <button className="ap-btn ghost" onClick={onBack}>← All guides</button>
    <h1>{g.title}</h1><p>{g.summary}</p>
    <div className="fa-sos"><p>{g.call}</p><a className="ap-btn danger" href="tel:112">Call 112</a></div>
    <p>General first-aid information. Follow the emergency dispatcher's instructions. This does not replace trained medical care.</p>
    {g.status === "loading" && <p role="status">Loading translation; English instructions remain available.</p>}
    {g.status === "english" && !voice.lang.startsWith("en") && <p role="status">Translation unavailable; showing and reading English.</p>}
    <button className="ap-btn" disabled={!voice.canSpeak} onClick={() => voice.speak([g.title, g.call, ...g.steps.map(s => s.t + ". " + s.d), ...g.donts].join(". "), "guide", language)}>Read all instructions</button>
    <button className="ap-btn ghost" onClick={voice.stopSpeak}>Stop voice</button>
    {!voice.canSpeak && <p>Voice is unavailable on this device. Read the instructions below.</p>}
    <ol>{g.steps.map((s,i) => <li className="ap-card" style={{padding:20, marginTop:16}} key={i}><h2>{s.t}</h2><p>{s.d}</p><button className="ap-btn ghost" disabled={!voice.canSpeak} onClick={() => voice.speak(s.t + ". " + s.d, String(i), language)}>Read step {i+1}</button></li>)}</ol>
    <h2>Do not</h2><ul>{g.donts.map((d,i) => <li key={i}>{d}</li>)}</ul>
  </div>;
}
