import { useRef } from "react";

export default function Tilt({ children, className = "", ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    const s = ref.current.style;
    s.setProperty("--rx", `${-y * 9}deg`); s.setProperty("--ry", `${x * 9}deg`);
    s.setProperty("--mx", `${(x + 0.5) * 100}%`); s.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const leave = () => { ref.current.style.setProperty("--rx", "0deg"); ref.current.style.setProperty("--ry", "0deg"); };
  return <div ref={ref} className={`ap-tilt ${className}`} onMouseMove={move} onMouseLeave={leave} {...rest}>{children}</div>;
}