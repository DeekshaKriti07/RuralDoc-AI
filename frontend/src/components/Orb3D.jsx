import { useRef } from "react";
import { RuralDocMark } from "./Marks";
import { Pulse, Pill, MapPin, Stethoscope, Shield } from "./Icons";

export default function Orb3D() {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", (x * 40).toFixed(1));
    ref.current.style.setProperty("--rx", (-y * 30).toFixed(1));
  };
  const leave = () => { ref.current.style.setProperty("--rx", "0"); ref.current.style.setProperty("--ry", "0"); };
  return (
    <div className="ap-orb" onMouseMove={move} onMouseLeave={leave}>
      <span className="ap-glow" />
      <div className="ap-scene" ref={ref}>
        <div className="ap-orbit o1"><b /></div>
        <div className="ap-orbit o2"><b /></div>
        <div className="ap-cube">
          <i className="f1"><RuralDocMark size={46} color="#3ddc97" /></i>
          <i className="f2"><Pulse size={38} /></i>
          <i className="f3"><Pill size={38} /></i>
          <i className="f4"><MapPin size={38} /></i>
          <i className="f5"><Stethoscope size={38} /></i>
          <i className="f6"><Shield size={38} /></i>
        </div>
      </div>
    </div>
  );
}