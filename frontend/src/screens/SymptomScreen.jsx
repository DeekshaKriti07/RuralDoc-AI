import { useState } from "react";
import "../features.css";
import { RuralDocMark } from "../components/Marks";
import { Refresh } from "../components/Icons";
import ChatShell from "../components/ChatShell";
import AssessmentCard from "../components/AssessmentCard";
import { SpeakBtn } from "../components/VoiceUI";
import { MediaAttach, MediaPreview, useMedia } from "../components/MediaPicker";
import { useVoice } from "../useVoice";
import { apiRequest } from "../api";

const QUICK = ["I have fever", "I have a cough", "Stomach pain", "Headache", "Skin rash", "I got hurt"];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function SymptomScreen({ go, onOpenGuide }) {
  const voice = useVoice();
  const media = useMedia();
  const [msgs, setMsgs] = useState([]);
  const [aiState, setAiState] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState({});
  const lang = voice.lang.split("-")[0];

  const push = (m) => setMsgs((cur) => [...cur, { id: uid(), ...m }]);

  const call = async (payload) => {
    setLoading(true);
    try {
      const res = await apiRequest("/ai/symptom-check", { method: "POST", body: JSON.stringify({ language: lang, state: aiState, ...payload }) });
      setAiState(res.state);
      if (res.media && res.media.summary) push({ role: "assistant", kind: "photo", media: res.media });
      if (res.status === "need_description") push({ role: "assistant", kind: "text", text: res.message });
      if (res.status === "need_more_info") {
        setPicked({});
        const id = uid();
        setMsgs((cur) => [...cur, { id, role: "assistant", kind: "questions", text: res.message, questions: res.questions, done: false }]);
        if (voice.autoSpeak) voice.speak(res.message, id);
      }
      if (res.status === "assessment") {
        const id = uid();
        setMsgs((cur) => [...cur, { id, role: "assistant", kind: "assessment", a: res.assessment, sources: res.sources }]);
        if (voice.autoSpeak) voice.speak([res.assessment.summary, ...res.assessment.red_flags.slice(0, 3)].join(". "), id);
      }
    } catch (err) {
      push({ role: "assistant", kind: "text", error: true, text: err.message || "The AI assistant is currently unavailable. Please consult a healthcare provider directly, or use nearby hospital search." });
    } finally { setLoading(false); }
  };

  const send = (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    const images = media.images;
    if ((!text && !images.length) || loading) return;
    push({ role: "user", kind: "text", text: text || "(photo)", thumbs: media.items.map((i) => i.preview) });
    setInput(""); media.clear();
    call({ message: text, images });
  };

  const submitAnswers = (msg) => {
    const answers = Object.entries(picked).map(([id, value]) => ({ id, value }));
    if (!answers.length || loading) return;
    const label = msg.questions.map((q) => { const o = q.options.find((x) => x.value === picked[q.id]); return o ? `${q.text} ${o.label}` : null; }).filter(Boolean);
    setMsgs((cur) => cur.map((m) => (m.id === msg.id ? { ...m, done: true, chosen: { ...picked } } : m)));
    push({ role: "user", kind: "text", text: label.join("\n") });
    call({ answers });
  };

  const skip = (msg) => {
    setMsgs((cur) => cur.map((m) => (m.id === msg.id ? { ...m, done: true } : m)));
    call({ force_assessment: true, answers: Object.entries(picked).map(([id, value]) => ({ id, value })) });
  };

  const restart = () => { voice.stopSpeak(); setMsgs([]); setAiState(null); setPicked({}); setInput(""); media.clear(); };

  const hasAssessment = msgs.some((m) => m.kind === "assessment");

  return (
    <ChatShell title="Symptom check" sub="I will ask a few questions, then explain the likely causes" accent="#3ddc97" voice={voice}
      input={input} setInput={setInput} onSend={send} loading={loading || media.busy}
      placeholder={`Describe the problem in ${voice.info.name}, or add a photo…`} trigger={msgs.length}
      attach={<MediaAttach media={media} />} preview={<MediaPreview media={media} />}
      headerExtra={msgs.length > 0 ? <button className="ap-btn ghost sm" onClick={restart}><Refresh size={14} /> New check</button> : null}>
      <div className="ap-m">
        <span className="ap-av"><RuralDocMark size={18} color="#04140e" /></span>
        <div className="ap-b ai">
          <p>{voice.info.sym}</p>
          <SpeakBtn voice={voice} id="hello" text={voice.info.sym} />
          {msgs.length === 0 && (
            <div className="as-quick">{QUICK.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
          )}
        </div>
      </div>

      {msgs.map((m) => {
        if (m.role === "user") {
          return (
            <div key={m.id} className="ap-m u">
              <div className="ap-b me">
                {m.thumbs && m.thumbs.length > 0 && <div className="md-inline">{m.thumbs.map((t, i) => <img key={i} src={t} alt="" />)}</div>}
                {m.text.split("\n").map((l, i) => <p key={i}>{l}</p>)}
              </div>
            </div>
          );
        }
        if (m.kind === "photo") {
          return (
            <div key={m.id} className="ap-m"><span className="ap-av"><RuralDocMark size={18} color="#04140e" /></span>
              <div className="ap-b ai"><b>Photo</b><p>{m.media.summary}</p>{m.media.quality === "poor" && <p className="rec">The photo is unclear. A clearer, well-lit photo helps.</p>}</div></div>
          );
        }
        if (m.kind === "questions") {
          const ready = Object.keys(picked).length > 0;
          return (
            <div key={m.id} className="ap-m"><span className="ap-av"><RuralDocMark size={18} color="#04140e" /></span>
              <div className="ap-b ai as-q">
                <p>{m.text}</p>
                {m.questions.map((q) => {
                  const sel = m.done ? (m.chosen || {})[q.id] : picked[q.id];
                  return (
                    <div key={q.id} className="as-qrow">
                      <div className="as-qtext">{q.text}</div>
                      <div className="as-opts">
                        {q.options.map((o) => (
                          <button key={o.value} disabled={m.done} className={sel === o.value ? "on" : ""} onClick={() => setPicked((p) => ({ ...p, [q.id]: o.value }))}>{o.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {!m.done && (
                  <div className="as-qfoot">
                    <button className="ap-btn sm" disabled={!ready || loading} onClick={() => submitAnswers(m)}>Continue</button>
                    <button className="as-link" disabled={loading} onClick={() => skip(m)}>Skip questions, show result</button>
                  </div>
                )}
              </div>
            </div>
          );
        }
        if (m.kind === "assessment") {
          return (
            <div key={m.id} className="ap-m wide"><span className="ap-av"><RuralDocMark size={18} color="#04140e" /></span>
              <AssessmentCard a={m.a} sources={m.sources} voice={voice} id={m.id} onOpenGuide={onOpenGuide} go={go} onRestart={restart} />
            </div>
          );
        }
        return (
          <div key={m.id} className="ap-m"><span className="ap-av"><RuralDocMark size={18} color="#04140e" /></span>
            <div className={`ap-b ai ${m.error ? "em" : ""}`}><p>{m.text}</p></div></div>
        );
      })}
      {hasAssessment && <div style={{ height: 8 }} />}
    </ChatShell>
  );
}
