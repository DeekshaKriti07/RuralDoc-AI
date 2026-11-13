export function RuralDocMark({ size = 28, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 6C12 6 6 12 6 20c0 3 1 5.5 2.5 7.7" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M20 34c8 0 14-6 14-14 0-3-1-5.5-2.5-7.7" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M9 20h5l2.5-6 3 12 2.5-6H31" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function SymptomIllustration({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="20" r="10" fill="none" stroke="#D7E8D2" strokeWidth="1.5" />
      <path d="M20 18c1-3 3-4 5-2M32 17c1-3 3-3 4-1" stroke="#D7E8D2" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M14 50c0-11 6-19 14-19s14 8 14 19" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M14 50c1-9 6-16 14-16" stroke="#D7E8D2" strokeWidth="1" fill="none" strokeDasharray="1 3" />
      <path d="M8 34h7l3-9 4 18 4-9h8" stroke="#F2C879" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="34" r="1.4" fill="#fff" /><circle cx="48" cy="34" r="1.4" fill="#fff" />
    </svg>
  );
}

export function MedicineIllustration({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <rect x="14" y="4" width="16" height="34" rx="8" fill="#fff" stroke="#B8863A" strokeWidth="1.2" />
      <path d="M14 21h16" stroke="#B8863A" strokeWidth="1.2" />
      <ellipse cx="22" cy="12" rx="3.5" ry="2" fill="none" stroke="#B8863A" strokeWidth="0.8" opacity="0.5" />
      <circle cx="19" cy="29" r="1.4" fill="#5C4210" /><circle cx="25" cy="32" r="1.4" fill="#5C4210" />
      <path d="M6 40c4-2 8-3 14-3s10 1 14 3" stroke="#5C4210" strokeWidth="1" fill="none" strokeDasharray="2 2" opacity="0.5" />
    </svg>
  );
}

export function HospitalIllustration({ size = 90 }) {
  return (
    <svg width={size} height={size * 0.71} viewBox="0 0 90 64" fill="none">
      <path d="M10 40 L45 12 L80 40" stroke="#C4693F" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 38 L45 18 L72 38" stroke="#C4693F" strokeWidth="0.8" fill="none" strokeDasharray="1 3" opacity="0.6" />
      <rect x="20" y="40" width="50" height="18" rx="1" stroke="#C4693F" strokeWidth="2" fill="none" />
      <path d="M40 49h10M45 44v10" stroke="#C4693F" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 12v-6M42 8l3-2 3 2" stroke="#C4693F" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="24" r="1" fill="#C4693F" /><circle cx="76" cy="24" r="1" fill="#C4693F" />
    </svg>
  );
}

export function RecordsIllustration({ size = 90 }) {
  return (
    <svg width={size} height={size * 0.71} viewBox="0 0 90 64" fill="none">
      <rect x="24" y="6" width="42" height="52" rx="3" stroke="#3E86B8" strokeWidth="2" fill="#fff" transform="rotate(-4 45 32)" />
      <path d="M32 20h26M32 30h26M32 40h16" stroke="#3E86B8" strokeWidth="1.4" transform="rotate(-4 45 32)" />
      <circle cx="70" cy="14" r="6" fill="none" stroke="#3E86B8" strokeWidth="1.2" />
      <path d="M67 14l2 2 4-4" stroke="#3E86B8" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckinIllustration({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M6 20c0-8 6-14 14-14M34 20c0 8-6 14-14 14" stroke="#8A7333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M20 6l3 3-3 3M20 34l-3-3 3-3" stroke="#8A7333" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VillageEmptyMark({ color, size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M20 60 L50 34 L80 60" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="28" y="60" width="44" height="24" rx="2" stroke={color} strokeWidth="3" fill="none" />
      <path d="M44 84V70h12v14" stroke={color} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M62 44V34h8v6" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M10 84h80" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}