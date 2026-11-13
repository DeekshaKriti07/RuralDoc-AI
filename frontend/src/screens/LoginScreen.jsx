import { useState } from "react";
import { RuralDocMark } from "../components/Marks";
import { Check, Pill, Pulse, MapPin, Arrow } from "../components/Icons";
import { login, signup } from "../api";
import "./login.css";

export default function LoginScreen({ onLogin, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = isLogin ? await login(email, password) : await signup(name, email, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setMode(isLogin ? "signup" : "login"); setError(""); };

  return (
    <div className="lg">
      <div className="lg-aurora"><i /><i /></div>

      {/* left showcase */}
      <aside className="lg-side">
        <div className="lg-brand"><span className="lg-logo"><RuralDocMark size={20} color="#04140e" /></span>RuralDoc</div>

        <div className="lg-showcase">
          <div className="lg-orb"><span /><span /><span /></div>
          <div className="lg-card c1"><b><Pill size={16} color="#3ddc97" /> Paracetamol</b><small>Today, 8:00 AM</small><Check size={16} color="#3ddc97" /></div>
          <div className="lg-card c2"><b><Pulse size={16} color="#ff8f7a" /> Symptom check</b><small>Low risk · rest advised</small></div>
          <div className="lg-card c3"><b><MapPin size={16} color="#8aa4ff" /> Health Centre</b><small>1.2 km away</small></div>
        </div>

        <div className="lg-quote">
          <h2>Healthcare that reaches every village.</h2>
          <p>Symptom checks, records, reminders and nearby care in one simple app.</p>
        </div>
      </aside>

      {/* right form */}
      <main className="lg-main">
        {onBack && <button type="button" className="lg-back" onClick={onBack}>← Back to home</button>}

        <form className="lg-form" onSubmit={submit}>
          <div className="lg-tabs">
            <button type="button" className={isLogin ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" className={!isLogin ? "on" : ""} onClick={() => { setMode("signup"); setError(""); }}>Create account</button>
          </div>

          <h1>{isLogin ? "Welcome back" : "Join RuralDoc"}</h1>
          <p className="lg-sub">{isLogin ? "Sign in to reach your health assistant." : "Takes less than a minute. Free forever."}</p>

          {error && <div className="lg-err">{error}</div>}

          {!isLogin && (
            <label className="lg-f">
              <span>Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
            </label>
          )}

          <label className="lg-f">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>

          <label className="lg-f">
            <span>Password</span>
            <div className="lg-pw">
              <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} required />
              <button type="button" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
            </div>
          </label>

          <button type="submit" className="lg-submit" disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"} {!loading && <Arrow size={18} />}
          </button>

          <p className="lg-switch">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button type="button" onClick={switchMode}>{isLogin ? "Create an account" : "Sign in"}</button>
          </p>

          <p className="lg-note">RuralDoc gives guidance, not a medical diagnosis.</p>
        </form>
      </main>
    </div>
  );
}