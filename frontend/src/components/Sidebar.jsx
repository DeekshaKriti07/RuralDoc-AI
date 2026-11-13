import { Home, Stethoscope, MessageCircle, FolderHeart, Bell, MapPin, LogOut, FirstAid } from "./Icons";
import { RuralDocMark } from "./Marks";

const NAV = [
  { id: "home", icon: Home, label: "Home" },
  { id: "symptom", icon: Stethoscope, label: "Symptom check" },
  { id: "chat", icon: MessageCircle, label: "Ask RuralDoc" },
  { id: "firstaid", icon: FirstAid, label: "First aid" },
  { id: "records", icon: FolderHeart, label: "Records" },
  { id: "reminders", icon: Bell, label: "Reminders" },
  { id: "hospitals", icon: MapPin, label: "Nearby care" },
];

export default function Sidebar({ screen, setScreen, onLogout, user }) {
  const name = user?.name || "You";
  return (
    <aside className="ap-side">
      <div className="ap-brand"><span className="ap-logo"><RuralDocMark size={20} color="#04140e" /></span>RuralDoc</div>
      <nav className="ap-nav">
        {NAV.map((n) => {
          const I = n.icon;
          return (
            <button key={n.id} className={screen === n.id ? "on" : ""} onClick={() => setScreen(n.id)} title={n.label}>
              <I size={20} /><span>{n.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="ap-user">
        <span className="ap-avatar">{name.charAt(0).toUpperCase()}</span>
        <div><b>{name}</b><small>Signed in</small></div>
        <button onClick={onLogout} title="Log out"><LogOut size={18} /></button>
      </div>
    </aside>
  );
}
