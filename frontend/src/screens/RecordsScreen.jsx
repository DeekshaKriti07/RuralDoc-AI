import { useState, useEffect } from "react";
import { Plus, ChevronRight, FileText, X, Trash2, ArrowLeft } from "../components/Icons";
import { apiRequest } from "../api";

const RECORD_TYPES = ["diagnosis", "allergy", "medication", "visit_note", "vaccination", "document"];
const COLORS = { diagnosis: "#8aa4ff", medication: "#3ddc97", allergy: "#ff8f7a", visit_note: "#b69cff", vaccination: "#2bd4c4", document: "#f4c878" };
const label = (s) => s.replace("_", " ");

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ record_type: "diagnosis", title: "", details: "" });

  const loadRecords = async () => {
    try { setRecords(await apiRequest("/records")); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadRecords(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    try {
      await apiRequest("/records", { method: "POST", body: JSON.stringify(form) });
      setForm({ record_type: "diagnosis", title: "", details: "" });
      setShowForm(false);
      loadRecords();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      await apiRequest(`/records/${id}`, { method: "DELETE" });
      setSelected(null);
      loadRecords();
    } catch (err) { console.error(err); }
  };

  if (selected) {
    const c = COLORS[selected.record_type] || "#8aa4ff";
    return (
      <div className="ap-page" style={{ maxWidth: 760 }}>
        <button className="ap-back" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back to records</button>
        <div className="ap-card ap-detail" style={{ "--c": c }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <span className="ap-tag">{label(selected.record_type)}</span>
              <h1 className="ap-title" style={{ fontSize: 30 }}>{selected.title}</h1>
            </div>
            <button className="ap-btn danger sm" onClick={() => handleDelete(selected.id)}><Trash2 size={14} /> Delete</button>
          </div>
          {selected.details && <p className="d">{selected.details}</p>}
          {selected.recorded_date && <p className="ap-sub" style={{ marginTop: 16 }}>Recorded: {selected.recorded_date}</p>}
          <p className="ap-sub" style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 13 }}>Added {new Date(selected.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  const shown = records.filter((r) => filter === "all" || r.record_type === filter);

  return (
    <div className="ap-page">
      <div className="ap-head">
        <div>
          <span className="ap-eyebrow">Your health, in one place</span>
          <h1 className="ap-title">Records</h1>
          <p className="ap-sub">Everything a doctor has told you, kept safe and easy to find.</p>
        </div>
        <button className="ap-btn" onClick={() => setShowForm(true)}><Plus size={16} /> Add record</button>
      </div>

      <div className="ap-chips">
        {["all", ...RECORD_TYPES].map((t) => (
          <button key={t} className={`ap-chip ${filter === t ? "on" : ""}`} onClick={() => setFilter(t)}>{label(t)}</button>
        ))}
      </div>

      {loading ? (
        <div className="ap-empty">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="ap-card ap-empty"><FileText size={40} /><p>No records here yet. Add your first one.</p></div>
      ) : (
        <div className="ap-rows">
          {shown.map((r, i) => (
            <div key={r.id} className="ap-row" style={{ "--c": COLORS[r.record_type] || "#8aa4ff", animationDelay: `${i * 50}ms` }} onClick={() => setSelected(r)}>
              <div className="l" style={{ paddingLeft: 8 }}>
                <div><span className="ap-tag">{label(r.record_type)}</span><b>{r.title}</b></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="ap-ib red" onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}><Trash2 size={15} /></button>
                <ChevronRight size={18} color="#6f8c80" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="ap-modal" onClick={() => setShowForm(false)}>
          <div className="ap-card ap-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ap-sheet-h"><h3>New record</h3><button className="ap-ib" onClick={() => setShowForm(false)}><X size={16} /></button></div>
            <label className="ap-lab">Type</label>
            <select className="ap-select" value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })}>
              {RECORD_TYPES.map((rt) => <option key={rt} value={rt}>{label(rt)}</option>)}
            </select>
            <label className="ap-lab">Title</label>
            <input className="ap-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Seasonal allergy" />
            <label className="ap-lab">Details (optional)</label>
            <textarea className="ap-ta ap-input" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            <button className="ap-btn" onClick={handleAdd}>Save record</button>
          </div>
        </div>
      )}
    </div>
  );
}