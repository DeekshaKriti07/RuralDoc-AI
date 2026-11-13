import { useState } from "react";
import { Phone, MapPin, FirstAid, ChevronRight, Check, AlertTriangle, FileText } from "./Icons";
import { SpeakBtn } from "./VoiceUI";

export function GuideLinks({ items = [], onOpen, title }) {
  if (!items.length) return null;
  return (
    <div className="as-guides">
      {title && <h4>{title}</h4>}
      {items.map((g) => (
        <button key={g.id} type="button" className={`as-guide ${g.emergency ? "em" : ""}`} onClick={() => onOpen?.(g.id)}>
          <FirstAid size={18} />
          <span><b>{g.title}</b>{g.why && <small>{g.why}</small>}</span>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}

const Block = ({ title, items, tone }) => (items && items.length ? (
  <div className={`as-block ${tone || ""}`}>
    <h4>{title}</h4>
    <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
  </div>
) : null);

export default function AssessmentCard({ a, sources = [], voice, id, onOpenGuide, go, onRestart }) {
  const [more, setMore] = useState(false);
  const L = a.labels || {};
  const spoken = [a.summary, a.red_flags.length ? `${L.red_flags}: ${a.red_flags.join(", ")}` : "", ...a.self_care].filter(Boolean).join(". ");
  const copy = () => { try { navigator.clipboard.writeText(a.what_to_tell_doctor); } catch { /* ignore */ } };

  return (
    <div className="as-card">
      <div className={`as-urg ${a.urgency_level}`}>
        <AlertTriangle size={20} />
        <div><b>{a.urgency_label}</b><span>{a.summary}</span></div>
        <SpeakBtn voice={voice} id={id} text={spoken} />
      </div>

      {a.urgency_level === "emergency" && (
        <div className="as-actions">
          <a className="ap-btn danger" href="tel:112"><Phone size={16} /> Call 112</a>
          <a className="ap-btn ghost" href="tel:108"><Phone size={16} /> Ambulance 108</a>
          {go && <button className="ap-btn ghost" onClick={() => go("hospitals")}><MapPin size={16} /> Nearest hospital</button>}
        </div>
      )}

      <GuideLinks items={a.first_aid} onOpen={onOpenGuide} title={L.first_aid} />

      {a.photo_lines && a.photo_lines.length > 0 && (
        <div className="as-block photo"><h4>{L.photo}</h4><ul>{a.photo_lines.map((t, i) => <li key={i}>{t}</li>)}</ul><small>{L.photo_note}</small></div>
      )}

      <div className="as-block">
        <h4>{L.possible_causes}</h4>
        <div className="as-causes">
          {a.possible_causes.map((c) => (
            <div key={c.id} className={`as-cause ${c.likelihood}`}>
              <div className="as-cause-h"><b>{c.name}</b><span>{L[c.likelihood]}</span></div>
              <div className="as-bar"><i style={{ width: `${Math.max(8, c.share)}%` }} /></div>
              {c.matched.length > 0 && <small>{L.matched} {c.matched.join(", ")}</small>}
              {c.to_tell_apart.length > 0 && <small className="dim">{L.to_tell_apart} {c.to_tell_apart.join(", ")}</small>}
            </div>
          ))}
        </div>
      </div>

      <Block title={L.red_flags} items={a.red_flags} tone="red" />
      <Block title={L.self_care} items={a.self_care} />
      <Block title={L.see_doctor_if} items={a.see_doctor_if} />
      <Block title={L.records} items={a.record_notes} tone="info" />

      <div className="as-foot">
        <button className="as-link" onClick={() => setMore((m) => !m)}><FileText size={14} /> {L.for_doctor}</button>
        {onRestart && <button className="as-link" onClick={onRestart}>Start a new check</button>}
      </div>
      {more && (
        <div className="as-doc"><p>{a.what_to_tell_doctor}</p><button className="ap-btn ghost sm" onClick={copy}><Check size={14} /> Copy</button></div>
      )}
      {sources.length > 0 && <small className="as-src">Reference reading: {sources.map((s) => s.title).filter((v, i, arr) => arr.indexOf(v) === i).join(" · ")}</small>}
      <p className="ap-disc">{L.disclaimer}</p>
    </div>
  );
}
