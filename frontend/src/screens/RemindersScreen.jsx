import { useState, useEffect, useRef } from "react";
import { Plus, Clock, X, Bell, Check, Trash2 } from "../components/Icons";
import { apiRequest } from "../api";

function Ring({ done, total }) {
  const r = 44, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3ddc97" /><stop offset="1" stopColor="#8aa4ff" /></linearGradient></defs>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#rg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="60" y="67" textAnchor="middle" fill="#e9f5ef" fontSize="22" fontWeight="800">{done}/{total}</text>
    </svg>
  );
}

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ medicine_name: "", dosage: "", frequency: "", reminder_time: "" });
  const [notifPermission, setNotifPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const notifiedToday = useRef(new Set());

  const load = async () => {
    try { setReminders(await apiRequest("/reminders")); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().then(setNotifPermission); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const todayKey = now.toDateString();
      reminders.forEach((r) => {
        if (!r.reminder_time) return;
        const rt = r.reminder_time.slice(0, 5);
        const key = `${r.id}-${todayKey}-${rt}`;
        if (rt === hhmm && !notifiedToday.current.has(key)) {
          notifiedToday.current.add(key);
          new Notification("Time for your medicine", { body: `${r.medicine_name}${r.dosage ? ` — ${r.dosage}` : ""}` });
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders]);

  const handleAdd = async () => {
    if (!form.medicine_name.trim()) return;
    try {
      await apiRequest("/reminders", { method: "POST", body: JSON.stringify(form) });
      setForm({ medicine_name: "", dosage: "", frequency: "", reminder_time: "" });
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
  };

  const markTaken = async (id) => {
    try {
      await apiRequest(`/reminders/${id}/log`, { method: "POST", body: JSON.stringify({ status: "taken", scheduled_time: new Date().toISOString() }) });
      await load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    try { await apiRequest(`/reminders/${id}`, { method: "DELETE" }); load(); }
    catch (err) { setError(err.message); }
  };

  const done = reminders.filter((r) => r.taken_today).length;

  return (
    <div className="ap-page">
      {error && <p role="alert" className="ap-warn">{error}</p>}
      <div className="ap-head">
        <div>
          <span className="ap-eyebrow" style={{ color: "#8aa4ff" }}>Stay on track</span>
          <h1 className="ap-title">Reminders</h1>
          <p className="ap-sub">Medicine alerts work while this page is open and notifications are allowed. Use a separate alarm for critical doses.</p>
        </div>
        <button className="ap-btn blue" onClick={() => setShowForm(true)}><Plus size={16} /> Add medicine</button>
      </div>

      {notifPermission !== "granted" && (
        <div className="ap-warn"><Bell size={16} /> Notifications are blocked. Enable them in your browser settings to get medicine alerts.</div>
      )}

      <div className="ap-card ap-ringcard">
        <Ring done={done} total={reminders.length} />
        <div>
          <h3>{reminders.length === 0 ? "No medicines yet" : done === reminders.length ? "All done for today" : "Today's progress"}</h3>
          <p>{reminders.length === 0 ? "Add your first medicine to start tracking." : `${done} of ${reminders.length} medicines taken today.`}</p>
        </div>
      </div>

      <h2 className="ap-h2" style={{ marginTop: 0 }}>Your medicines</h2>
      {loading ? (
        <div className="ap-empty">Loading…</div>
      ) : reminders.length === 0 ? (
        <div className="ap-card ap-empty"><Bell size={40} /><p>No reminders yet. Add your first one.</p></div>
      ) : (
        <div className="ap-rows">
          {reminders.map((r, i) => (
            <div key={r.id} className="ap-row" style={{ "--c": r.taken_today ? "#3ddc97" : "#8aa4ff", cursor: "default", animationDelay: `${i * 50}ms` }}>
              <div className="l" style={{ paddingLeft: 8 }}>
                <span className="ap-ico" style={{ background: r.taken_today ? "rgba(61,220,151,.15)" : "rgba(138,164,255,.15)", color: r.taken_today ? "#3ddc97" : "#8aa4ff" }}>
                  {r.taken_today ? <Check size={20} /> : <Clock size={20} />}
                </span>
                <div>
                  <b>{r.medicine_name}</b>
                  <small>{r.dosage} {r.frequency ? `· ${r.frequency}` : ""}</small>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {r.reminder_time && <span className="ap-time">{r.reminder_time.slice(0, 5)}</span>}
                {r.taken_today ? <span className="ap-ok">Taken today</span> : <button className="ap-btn blue sm" onClick={() => markTaken(r.id)}>Mark taken</button>}
                <button className="ap-ib red" title="Delete reminder" onClick={() => handleDelete(r.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="ap-modal" onClick={() => setShowForm(false)}>
          <div className="ap-card ap-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ap-sheet-h"><h3>New reminder</h3><button className="ap-ib" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <label className="ap-lab">Medicine name</label>
            <input className="ap-input" value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
            <label className="ap-lab">Dosage</label>
            <input className="ap-input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 1 tablet" />
            <label className="ap-lab">Frequency</label>
            <input className="ap-input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="e.g. Twice daily" />
            <label className="ap-lab">Reminder time</label>
            <input className="ap-input" type="time" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
            <button className="ap-btn blue" onClick={handleAdd}>Save reminder</button>
          </div>
        </div>
      )}
    </div>
  );
}