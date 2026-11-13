import { useState, useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Phone, MapPin, LocateFixed, AlertCircle } from "../components/Icons";
import { apiRequest } from "../api";

const COLORS = { Hospital: "#ff6b5a", Clinic: "#3ddc97", Pharmacy: "#f4c878" };
const DEFAULT_CENTER = [11.0168, 76.9558];

const pinIcon = (color, active) =>
  L.divIcon({
    className: "", iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32],
    html: `<svg width="30" height="38" viewBox="0 0 30 38" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.4));transform:scale(${active ? 1.3 : 1});transform-origin:50% 100%;transition:transform .2s">
      <path d="M15 37S2 24 2 14a13 13 0 0 1 26 0c0 10-13 23-13 23z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <path d="M15 8v12M9 14h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  });

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default function HospitalsScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [pos, setPos] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const mapEl = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const markers = useRef({});
  const listRefs = useRef({});

  useEffect(() => {
    map.current = L.map(mapEl.current, { zoomControl: false }).setView(DEFAULT_CENTER, 12);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current.remove(); map.current = null; };
  }, []);

  const locate = () => {
    setError("");
    setLoading(true);
    if (!navigator.geolocation) { setError("Your browser doesn't support location access."); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const p = [coords.latitude, coords.longitude];
        setPos(p);
        try {
          const data = await apiRequest(`/hospitals/nearby?lat=${p[0]}&lon=${p[1]}&radius=8000`);
          setResults(data);
          if (!data.length) setError("No listed facilities found within 8 km. Try again later.");
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
      },
      (g) => {
        setLoading(false);
        setError(g.code === g.PERMISSION_DENIED
          ? "Location access was denied. Allow it in your browser to find nearby care."
          : "Could not determine your location. Check your device's location settings.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  useEffect(locate, []);

  const filtered = useMemo(() => results.filter((h) => {
    const q = search.toLowerCase();
    return (filter === "All" || h.type === filter) && (h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q));
  }), [results, search, filter]);

  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    markers.current = {};
    if (pos) {
      L.circle(pos, { radius: 8000, color: "#3ddc97", weight: 1, fillOpacity: 0.05, dashArray: "4 6" }).addTo(layer.current);
      L.marker(pos, { icon: L.divIcon({ className: "", html: '<div class="rd-user-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), zIndexOffset: 1000 }).addTo(layer.current);
    }
    filtered.forEach((h) => {
      const m = L.marker([h.lat, h.lon], { icon: pinIcon(COLORS[h.type] || "#8aa4ff", false) }).addTo(layer.current);
      m.bindPopup(`<b>${esc(h.name)}</b><br>${esc(h.type)} · ${h.distance_km} km<br><a target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}">Get directions</a>`);
      m.on("click", () => { setActiveId(h.id); listRefs.current[h.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
      markers.current[h.id] = m;
    });
  }, [filtered, pos]);

  useEffect(() => {
    if (!map.current) return;
    const pts = filtered.map((h) => [h.lat, h.lon]);
    if (pos) pts.push(pos);
    if (pts.length > 1) map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (pos) map.current.setView(pos, 14);
  }, [filtered, pos]);

  useEffect(() => {
    filtered.forEach((h) => markers.current[h.id]?.setIcon(pinIcon(COLORS[h.type] || "#8aa4ff", h.id === activeId)));
  }, [activeId, filtered]);

  const focus = (h) => {
    setActiveId(h.id);
    map.current.flyTo([h.lat, h.lon], 16, { duration: 0.8 });
    markers.current[h.id]?.openPopup();
    mapEl.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="ap-page">
      <div className="ap-head">
        <div>
          <span className="ap-eyebrow" style={{ color: "#f4c878" }}>Help, close by</span>
          <h1 className="ap-title">Nearby care</h1>
          <p className="ap-sub">{pos ? `${filtered.length} places within 8 km of you` : "Finding your location…"}</p>
        </div>
      </div>

      <div className="ap-searchbar">
        <div className="w">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clinics, hospitals, pharmacies…" />
        </div>
        <button className="ap-loc" onClick={locate} title="Refresh location"><LocateFixed size={19} color="#04140e" /></button>
      </div>

      <div className="ap-chips">
        {["All", "Hospital", "Clinic", "Pharmacy"].map((f) => (
          <button key={f} className={`ap-chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="ap-map">
        <div className="ap-mapbox" ref={mapEl} />
        {loading && <div className="ap-pill">Finding nearby care…</div>}
      </div>

      {error && !loading && <div className="ap-warn"><AlertCircle size={17} /><span>{error}</span></div>}

      <div className="ap-rows">
        {filtered.map((h, i) => {
          const c = COLORS[h.type] || "#8aa4ff";
          return (
            <div key={h.id} ref={(el) => (listRefs.current[h.id] = el)} className={`ap-row ${h.id === activeId ? "on" : ""}`} style={{ "--c": c, animationDelay: `${Math.min(i, 8) * 40}ms` }} onClick={() => focus(h)}>
              <div className="l" style={{ paddingLeft: 8 }}>
                <span className="ap-ico" style={{ background: c + "22", color: c }}><MapPin size={20} /></span>
                <div style={{ minWidth: 0 }}>
                  <b>{h.name}</b>
                  <small>{h.type} · {h.distance_km} km{h.address ? ` · ${h.address}` : ""}</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                {h.phone && <a className="ap-btn sm" href={`tel:${h.phone}`}><Phone size={14} /> Call</a>}
                <a className="ap-btn ghost sm" href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noreferrer"><MapPin size={14} /> Directions</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}