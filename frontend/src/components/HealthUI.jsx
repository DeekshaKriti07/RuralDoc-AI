import { AlertTriangle } from "./Icons";

export function UrgencyBadge({ level }) {
  const map = { monitor: "Monitor at home", see_doctor: "See a doctor soon", emergency: "Seek immediate care" };
  const k = map[level] ? level : "monitor";
  return (
    <span className={`ap-urg ${k}`}>
      {k === "emergency" && <AlertTriangle size={14} />}
      {map[k]}
    </span>
  );
}

export function Disclaimer() {
  return <p className="ap-disc">This is not a medical diagnosis. Please consult a healthcare provider.</p>;
}