import { useEffect, useRef } from "react";
import { RuralDocMark } from "../components/Marks";
import { Stethoscope, MessageCircle, FolderHeart, Bell, MapPin, Shield, Pill, Pulse, Arrow, Check } from "../components/Icons";
import "./landing.css";

const FEATURES = [
  { icon: Stethoscope, c: "#3ddc97", t: "Symptom check", d: "Describe how you feel. Get clear next steps and red-flag alerts." },
  { icon: MessageCircle, c: "#8aa4ff", t: "Ask RuralDoc", d: "A patient health assistant that answers in plain language." },
  { icon: FolderHeart, c: "#f4c878", t: "Health records", d: "Keep prescriptions and reports together, always within reach." },
  { icon: Bell, c: "#ff8f7a", t: "Reminders", d: "Never miss a dose with gentle, on-time medicine nudges." },
  { icon: MapPin, c: "#2bd4c4", t: "Nearby care", d: "Live map of hospitals, clinics and pharmacies around you." },
  { icon: Shield, c: "#b69cff", t: "Private by design", d: "Your data stays yours, protected end to end." },
];

function Tilt({ children, className = "" }) {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--rx", `${-y * 14}deg`);
    ref.current.style.setProperty("--ry", `${x * 14}deg`);
    ref.current.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    ref.current.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const leave = () => { ref.current.style.setProperty("--rx", "0deg"); ref.current.style.setProperty("--ry", "0deg"); };
  return <div ref={ref} className={`ld-tilt ${className}`} onMouseMove={move} onMouseLeave={leave}>{children}</div>;
}

export default function LandingScreen({ onStart }) {
  const root = useRef(null);
  const stage = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
    root.current.querySelectorAll(".ld-rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onMove = (e) => {
    const r = stage.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    stage.current.style.setProperty("--ry", (x * 22).toFixed(2));
    stage.current.style.setProperty("--rx", (-y * 16).toFixed(2));
  };
  const onLeave = () => { stage.current.style.setProperty("--ry", "0"); stage.current.style.setProperty("--rx", "0"); };

  return (
    <div className="ld" ref={root}>
      <div className="ld-aurora"><i /><i /><i /></div>
      <div className="ld-grid" />

      <nav className="ld-nav">
        <div className="ld-brand"><span className="ld-logo"><RuralDocMark size={20} color="#04140e" /></span>RuralDoc</div>
        <div className="ld-nav-r">
          <button className="ld-btn ghost" onClick={() => onStart("login")}>Sign in</button>
          <button className="ld-btn" onClick={() => onStart("signup")}>Get started</button>
        </div>
      </nav>

      <header className="ld-hero">
        <div className="ld-copy">
          <span className="ld-pill"><i />Healthcare for every village</span>
          <h1>Your doctor, <span className="ld-grad">closer than the nearest road.</span></h1>
          <p>Check symptoms, keep records, track medicines and find nearby care on a live map. Simple, private and built for rural communities.</p>
          <div className="ld-cta">
            <button className="ld-btn big" onClick={() => onStart("signup")}>Create free account <Arrow size={18} /></button>
            <button className="ld-btn big ghost" onClick={() => onStart("login")}>I have an account</button>
          </div>
          <div className="ld-trust">
            <span><Check size={15} color="#3ddc97" /> No cost</span>
            <span><Check size={15} color="#3ddc97" /> Works on any phone</span>
            <span><Check size={15} color="#3ddc97" /> Private</span>
          </div>
        </div>

        <div className="ld-stage" ref={stage} onMouseMove={onMove} onMouseLeave={onLeave}>
          <div className="ld-scene">
            <div className="ld-ground">
              <span className="ld-ring" /><span className="ld-ring r2" /><span className="ld-ring r3" />
            </div>
            <div className="ld-phone">
              <div className="ld-notch" />
              <div className="ld-ph-head"><RuralDocMark size={18} color="#3ddc97" /> RuralDoc</div>
              <div className="ld-bub me">I have a fever since morning</div>
              <div className="ld-bub ai">Sorry to hear that. Any cough or body ache? Let's check together.</div>
              <div className="ld-ecg">
                <svg viewBox="0 0 200 50" preserveAspectRatio="none"><path d="M0 25h50l8-18 12 38 10-26 8 6h112" /></svg>
              </div>
              <div className="ld-ph-cta">Start symptom check</div>
            </div>
            <div className="ld-fc a" style={{ "--z": "110px" }}><span style={{ background: "#3ddc9722", color: "#3ddc97" }}><Pill size={18} /></span><div><b>Paracetamol</b><small>Today, 8:00 AM</small></div><Check size={16} color="#3ddc97" /></div>
            <div className="ld-fc b" style={{ "--z": "150px" }}><span style={{ background: "#ff8f7a22", color: "#ff8f7a" }}><Pulse size={18} /></span><div><b>Low risk</b><small>Rest & fluids advised</small></div></div>
            <div className="ld-fc c" style={{ "--z": "90px" }}><span style={{ background: "#8aa4ff22", color: "#8aa4ff" }}><MapPin size={18} /></span><div><b>Primary Health Centre</b><small>1.2 km away</small></div></div>
            <div className="ld-pin" style={{ "--z": "60px" }}><MapPin size={26} color="#fff" /></div>
          </div>
        </div>
      </header>

      <section className="ld-sec">
        <div className="ld-rv ld-head"><span className="ld-eyebrow">Everything in one place</span><h2>Care that turns with you</h2><p>Hover to pause the carousel.</p></div>
        <div className="ld-ringwrap">
          <div className="ld-ring3d">
            {FEATURES.map((f, i) => {
              const I = f.icon;
              return (
                <div className="ld-c" key={f.t} style={{ "--i": i }}>
                  <div className="ld-card">
                    <span className="ld-ic" style={{ background: f.c + "22", color: f.c }}><I size={26} /></span>
                    <h3>{f.t}</h3><p>{f.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ld-sec ld-mapsec">
        <div className="ld-rv ld-maptext">
          <span className="ld-eyebrow">Live map</span>
          <h2>Find help in seconds</h2>
          <p>See hospitals, clinics and pharmacies near you on an interactive map, filter by type and get directions in one tap.</p>
          <button className="ld-btn" onClick={() => onStart("signup")}>Try Nearby care <Arrow size={18} /></button>
        </div>
        <div className="ld-rv ld-mapplane">
          <div className="ld-plane">
            <span className="ld-road h" /><span className="ld-road v" /><span className="ld-road d" />
            {[["18%", "30%", "#C0392B", 0], ["62%", "22%", "#2E8B6A", .4], ["48%", "62%", "#D9922B", .8], ["78%", "58%", "#2E8B6A", 1.2]].map(([l, t, c, d], i) => (
              <span key={i} className="ld-mpin" style={{ left: l, top: t, "--c": c, animationDelay: `${d}s` }} />
            ))}
            <span className="ld-you" />
          </div>
        </div>
      </section>

      <section className="ld-sec">
        <div className="ld-rv ld-head"><span className="ld-eyebrow">How it works</span><h2>Three steps to better care</h2></div>
        <div className="ld-steps">
          {[["01", "Tell us how you feel", "Type or speak your symptoms in your own words."], ["02", "Get clear guidance", "Understand urgency and what to do next, instantly."], ["03", "Reach care nearby", "Open the map, call ahead and get directions."]].map(([n, t, d]) => (
            <Tilt key={n} className="ld-rv"><div className="ld-step"><em>{n}</em><h3>{t}</h3><p>{d}</p></div></Tilt>
          ))}
        </div>
      </section>

      <section className="ld-sec">
        <Tilt className="ld-rv"><div className="ld-final">
          <h2>Good health shouldn't depend on distance.</h2>
          <p>Join RuralDoc today. It takes less than a minute.</p>
          <button className="ld-btn big" onClick={() => onStart("signup")}>Get started free <Arrow size={18} /></button>
        </div></Tilt>
      </section>

      <footer className="ld-foot">
        <span>© {new Date().getFullYear()} RuralDoc</span>
        <span>RuralDoc provides guidance, not a medical diagnosis. In an emergency, call your local emergency number.</span>
      </footer>
    </div>
  );
}