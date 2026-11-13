import { useState, useEffect, useMemo } from "react";
import "../features.css";
import { FIRST_AID, FIRST_AID_BY_ID, CATEGORIES } from "../data/firstaid";
import { Search, Phone, Offline, ChevronRight } from "../components/Icons";

import FirstAidPlayer from "../components/FirstAidPlayer";
import { LangPicker } from "../components/VoiceUI";
import { useVoice } from "../useVoice";

export default function FirstAidScreen({ initialGuide, onConsumed }) {
  const voice = useVoice();
  const [open, setOpen] = useState(initialGuide || null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => { if (initialGuide) { setOpen(initialGuide); onConsumed?.(); } }, [initialGuide]); // eslint-disable-line
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return FIRST_AID.filter((g) => (cat === "all" || g.cat === cat) && (!t || `${g.title} ${g.summary} ${g.kw.join(" ")}`.toLowerCase().includes(t)));
  }, [q, cat]);

  if (open && FIRST_AID_BY_ID[open]) {
    return (
      <>
        <div className="ap-page" style={{ paddingBottom: 0 }}><LangPicker voice={voice} /></div>
        <FirstAidPlayer guide={FIRST_AID_BY_ID[open]} voice={voice} onBack={() => { voice.stopSpeak(); setOpen(null); }} />
      </>
    );
  }

  return (
    <div className="ap-page">
      <div className="ap-head">
        <div>
          <span className="ap-eyebrow" style={{ color: "#ff8f7a" }}>Be ready</span>
          <h1 className="ap-title">First aid</h1>
          <p className="ap-sub">Step-by-step instructions with voice. Call emergency services when needed.</p>
        </div>
        <span className={`fa-net ${online ? "" : "off"}`}><Offline size={14} />{online ? "Online" : "Offline: available content depends on device caching"}</span>
      </div>

      <div className="fa-sos">
        <div><b>In an emergency</b><span>Call for help first, then follow the guide.</span></div>
        <a className="ap-btn danger" href="tel:112"><Phone size={16} /> Call 112</a>
        <a className="ap-btn ghost" href="tel:108"><Phone size={16} /> Ambulance 108</a>
      </div>

      <LangPicker voice={voice} />

      <div className="ap-searchbar" style={{ marginTop: 18 }}>
        <div className="w"><Search size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: burn, snake bite, fever, choking…" /></div>
      </div>
      <div className="ap-chips">
        {CATEGORIES.map((c) => <button key={c.id} className={`ap-chip ${cat === c.id ? "on" : ""}`} onClick={() => setCat(c.id)}>{c.label}</button>)}
      </div>

      {shown.length === 0 ? <div className="ap-card ap-empty">No guide found. Try another word.</div> : (
        <div className="fa-grid">
          {shown.map((g, i) => (
            <button key={g.id} className={`ap-card fa-card ${g.cat}`} style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }} onClick={() => setOpen(g.id)}>
              <div className="fa-cardbody">
                <span className={`fa-tag ${g.cat}`}>{g.cat === "emergency" ? "Emergency" : "Everyday"}</span>
                <h3>{g.title}</h3>
                <p>{g.summary}</p>
                <span className="fa-open">{g.steps.length} steps <ChevronRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
