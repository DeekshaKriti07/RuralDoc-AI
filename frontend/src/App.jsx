import { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import "./features.css";
import LandingScreen from "./screens/LandingScreen";
import LoginScreen from "./screens/LoginScreen";
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const SymptomScreen = lazy(() => import("./screens/SymptomScreen"));
const RecordsScreen = lazy(() => import("./screens/RecordsScreen"));
const RemindersScreen = lazy(() => import("./screens/RemindersScreen"));
const HospitalsScreen = lazy(() => import("./screens/HospitalsScreen"));
const ChatScreen = lazy(() => import("./screens/ChatScreen"));
const FirstAidScreen = lazy(() => import("./screens/FirstAidScreen"));
import { apiRequest } from "./api";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [guideId, setGuideId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    document.documentElement.lang = localStorage.getItem("rd_lang") || navigator.language || "en";
    localStorage.removeItem("ruraldoc_token");
    localStorage.removeItem("ruraldoc_user");
    apiRequest("/auth/me").then(data => setUser(data.user)).catch(() => {}).finally(() => setChecking(false));
    const expired = () => { setUser(null); setShowLanding(false); };
    window.addEventListener("ruraldoc-session-expired", expired);
    return () => window.removeEventListener("ruraldoc-session-expired", expired);
  }, []);
  const handleLogin = (_token, u) => setUser(u);
  const handleLogout = async () => {
    try { await apiRequest("/auth/logout", {method:"POST",body:"{}"}); }
    catch { alert("Sign out failed. Please try again."); return; }
    setUser(null); setScreen("home"); setShowLanding(true);
  };
  // open a specific first-aid guide (used by the symptom checker and chat)
  const openGuide = (id) => { setGuideId(id); setScreen("firstaid"); };

  if (checking) return null;
  if (!user) {
    return showLanding
      ? <LandingScreen onStart={(m) => { setAuthMode(m); setShowLanding(false); }} />
      : <LoginScreen onLogin={handleLogin} initialMode={authMode} onBack={() => setShowLanding(true)} />;
  }

  return (
    <div className="ap">
      <div className="ap-bg"><i /><i /></div>
      <Sidebar screen={screen} setScreen={setScreen} onLogout={handleLogout} user={user} />
      <main className="ap-main"><Suspense fallback={<p role="status">Loading…</p>}>
        {screen === "home" && <HomeScreen go={setScreen} user={user} />}
        {screen === "symptom" && <SymptomScreen go={setScreen} onOpenGuide={openGuide} />}
        {screen === "chat" && <ChatScreen onOpenGuide={openGuide} />}
        {screen === "firstaid" && <FirstAidScreen initialGuide={guideId} onConsumed={() => setGuideId(null)} />}
        {screen === "records" && <RecordsScreen />}
        {screen === "reminders" && <RemindersScreen />}
        {screen === "hospitals" && <HospitalsScreen />}
      </Suspense></main>
    </div>
  );
}
