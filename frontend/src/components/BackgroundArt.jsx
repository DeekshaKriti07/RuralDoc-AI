export default function BackgroundArt({ variant = "home" }) {
  const compositions = {
    home: (
      <>
        <circle cx="880" cy="80" r="180" fill="#C23B6B" opacity="0.08" />
        <circle cx="60" cy="600" r="220" fill="#E8483A" opacity="0.07" />
        <circle cx="500" cy="720" r="140" fill="#1C86B0" opacity="0.06" />
        <path d="M20 140 Q 100 90 190 150 T 360 120" stroke="#1C86B0" strokeWidth="1.8" fill="none" opacity="0.2" strokeDasharray="2 7" strokeLinecap="round" />
        <path d="M550 40 Q 620 15 670 60 T 800 50" stroke="#F2A93B" strokeWidth="1.8" fill="none" opacity="0.25" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="920" cy="450" r="4" fill="#C23B6B" opacity="0.4" />
        <circle cx="150" cy="80" r="3" fill="#E8483A" opacity="0.35" />
      </>
    ),
    symptom: (
      <>
        <circle cx="120" cy="90" r="200" fill="#E8483A" opacity="0.07" />
        <circle cx="850" cy="600" r="180" fill="#C23B6B" opacity="0.06" />
        <path d="M40 40h6l3-9 4 18 4-9h30" stroke="#E8483A" strokeWidth="1.5" fill="none" opacity="0.22" strokeLinecap="round" />
        <path d="M700 500 Q 760 460 820 510 T 960 480" stroke="#1C86B0" strokeWidth="1.8" fill="none" opacity="0.2" strokeDasharray="2 7" />
        <circle cx="850" cy="120" r="3.5" fill="#F2A93B" opacity="0.4" />
      </>
    ),
    records: (
      <>
        <circle cx="900" cy="650" r="200" fill="#1C86B0" opacity="0.07" />
        <circle cx="80" cy="80" r="160" fill="#F2A93B" opacity="0.06" />
        <rect x="60" y="60" width="60" height="80" rx="4" fill="none" stroke="#1C86B0" strokeWidth="1.5" opacity="0.18" transform="rotate(-8 90 100)" />
        <path d="M780 40 Q 850 20 890 60" stroke="#C23B6B" strokeWidth="1.8" fill="none" opacity="0.2" strokeDasharray="2 7" />
      </>
    ),
    reminders: (
      <>
        <circle cx="80" cy="700" r="200" fill="#F2A93B" opacity="0.09" />
        <circle cx="920" cy="80" r="160" fill="#D96A2B" opacity="0.06" />
        <path d="M700 100c14-10 30-4 30 12s-18 20-28 8" stroke="#F2A93B" strokeWidth="1.5" fill="none" opacity="0.2" />
        <path d="M40 300 Q 100 270 150 310" stroke="#C23B6B" strokeWidth="1.5" fill="none" opacity="0.18" strokeDasharray="2 6" />
      </>
    ),
    hospitals: (
      <>
        <circle cx="850" cy="600" r="220" fill="#D96A2B" opacity="0.07" />
        <circle cx="100" cy="100" r="150" fill="#1C86B0" opacity="0.06" />
        <path d="M30 50 L70 20 L110 50" stroke="#D96A2B" strokeWidth="1.5" fill="none" opacity="0.2" />
        <path d="M600 30 Q 660 10 700 45" stroke="#1C86B0" strokeWidth="1.8" fill="none" opacity="0.18" strokeDasharray="2 7" />
      </>
    ),
    chat: (
      <>
        <circle cx="900" cy="120" r="190" fill="#C23B6B" opacity="0.08" />
        <circle cx="80" cy="650" r="160" fill="#1C86B0" opacity="0.06" />
        <path d="M40 500c10-14 30-14 34 4s-16 22-28 12" stroke="#C23B6B" strokeWidth="1.5" fill="none" opacity="0.2" />
        <circle cx="80" cy="80" r="3" fill="#1C86B0" opacity="0.35" />
      </>
    ),
  };

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 1000 800"
      preserveAspectRatio="xMidYMid slice"
    >
      {compositions[variant] || compositions.home}
    </svg>
  );
}