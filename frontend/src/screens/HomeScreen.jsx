import { useState, useEffect } from "react";
import { Stethoscope, MessageCircle, FolderHeart, Bell, MapPin, Check, Clock, Arrow, FirstAid } from "../components/Icons";
import Tilt from "../components/Tilt";
import Orb3D from "../components/Orb3D";
import { apiRequest } from "../api";

const TILES = [
  { id: "symptom", icon: Stethoscope, c: "#3ddc97", t: "Symptom check", d: "Describe how you feel and get clear next steps." },
  { id: "chat", icon: MessageCircle, c: "#8aa4ff", t: "Ask RuralDoc", d: "General health questions in plain language." },
  { id: "firstaid", icon: FirstAid, c: "#ff6b5a", t: "First aid", d: "Step-by-step help for burns, bites, choking and more. Works offline." },
  { id: "records", icon: FolderHeart, c: "#f4c878", t: "Records", d: "Diagnoses, allergies and notes in one place." },
  { id: "reminders", icon: Bell, c: "#ff8f7a", t: "Reminders", d: "Never miss a dose of your medicine." },
  { id: "hospitals", icon: MapPin, c: "#2bd4c4", t: "Nearby care", d: "Hospitals, clinics and pharmacies on a map." },
];

export default function HomeScreen({ go, user }) {
  const [rem, setRem] = useState([]);
  const [recCount, setRecCount] = useState(0);

  useEffect(() => {
    apiRequest("/reminders").then(setRem).catch(() => {});
    apiRequest("/records").then((r) => setRecCount(r.length)).catch(() => {});
  }, []);

  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = (user?.name || "").split(" ")[0];
  const taken = rem.filter((r) => r.taken_today).length;

  return (
    <div className="ap-page">
      <section className="ap-card ap-hero">
        <div className="ap-hero-c">
          <span className="ap-eyebrow">{greet}{first ? `, ${first}` : ""}</span>
          <h1>You're taken care of. <span className="ap-grad">Where do we start?</span></h1>
          <p>Check symptoms, track medicines, keep records and find care close to you.</p>
          <div><button className="ap-btn" onClick={() => go("symptom")}>Start symptom check <Arrow size={18} /></button></div>
        </div>
        <Orb3D />
      </section>

      <div className="ap-stats">
        <Tilt className="ap-card ap-stat"><em className="ap-grad">{rem.length}</em><span>Medicine reminders</span></Tilt>
        <Tilt className="ap-card ap-stat"><em className="ap-grad">{taken}/{rem.length}</em><span>Taken today</span></Tilt>
        <Tilt className="ap-card ap-stat"><em className="ap-grad">{recCount}</em><span>Health records</span></Tilt>
      </div>

      <h2 className="ap-h2">What would you like to do?</h2>
      <div className="ap-grid">
        {TILES.map((t) => {
          const I = t.icon;
          return (
            <Tilt key={t.id} className="ap-card ap-tile" onClick={() => go(t.id)}>
              <span className="ic" style={{ background: t.c + "22", color: t.c }}><I size={24} /></span>
              <h3>{t.t}</h3><p>{t.d}</p>
            </Tilt>
          );
        })}
      </div>

      <h2 className="ap-h2">Today's medicine</h2>
      <div className="ap-card ap-list">
        {rem.length === 0 ? (
          <div className="ap-empty">No reminders yet. <span style={{ color: "#3ddc97", cursor: "pointer", fontWeight: 700 }} onClick={() => go("reminders")}>Add one</span></div>
        ) : rem.slice(0, 5).map((r) => (
          <div className="ap-li" key={r.id}>
            <div className="l">
              <span className="ap-ico" style={{ background: r.taken_today ? "rgba(61,220,151,.15)" : "rgba(244,200,120,.15)", color: r.taken_today ? "#3ddc97" : "#f4c878" }}>
                {r.taken_today ? <Check size={19} /> : <Clock size={19} />}
              </span>
              <div><b>{r.medicine_name}</b><small>{r.reminder_time ? r.reminder_time.slice(0, 5) : "Any time"}{r.dosage ? ` · ${r.dosage}` : ""}</small></div>
            </div>
            {r.taken_today && <span className="ap-ok">Taken</span>}
          </div>
        ))}
      </div>
    </div>
  );
}