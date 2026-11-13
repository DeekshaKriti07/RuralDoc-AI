// Hand-drawn inline SVG icons (no icon library). Same props as before: size, color, strokeWidth, style.
const P = {
  Plus: <path d="M12 5v14M5 12h14" />,
  ChevronRight: <path d="M9 6l6 6-6 6" />,
  FileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  X: <path d="M6 6l12 12M18 6L6 18" />,
  Trash2: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  ArrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  Check: <path d="M5 12.5l4.5 4.5L19 7" />,
  Clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  Send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  Mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  MapPin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  Bell: <path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />,
  Search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  Phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  LocateFixed: <><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="8" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3" /></>,
  AlertCircle: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></>,
  AlertTriangle: <path d="M12 3l10 18H2zM12 10v5M12 18v.01" />,
  Home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  Stethoscope: <><path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-1" /><circle cx="19" cy="12" r="2" /></>,
  MessageCircle: <path d="M4 19l1.5-4A8 8 0 1 1 9 18.5z" />,
  FolderHeart: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 17l-3-3a1.8 1.8 0 0 1 3-2 1.8 1.8 0 0 1 3 2z" /></>,
  LogOut: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
  Sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></>,
  Moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  Shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  Pill: <path d="M10.5 20.5a4.9 4.9 0 0 1-7-7l10-10a4.9 4.9 0 0 1 7 7zM8.5 8.5l7 7" />,
  Pulse: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  Arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  // new
  Camera: <><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></>,
  Video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
  Play: <path d="M7 4l13 8-13 8z" />,
  Pause: <path d="M8 5v14M16 5v14" />,
  SkipBack: <path d="M18 5L8 12l10 7zM6 5v14" />,
  SkipForward: <path d="M6 5l10 7-10 7zM18 5v14" />,
  Volume: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>,
  FirstAid: <><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5" /></>,
  Refresh: <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />,
  Info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></>,
  Download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  Offline: <path d="M3 9a14 14 0 0 1 4-2.4M21 9a14 14 0 0 0-8-3.6M6.5 12.5a9 9 0 0 1 3-1.8M17.5 12.5a9 9 0 0 0-2.6-1.7M9.5 16a4.5 4.5 0 0 1 5 0M12 19.5v.01M3 3l18 18" />,
};

const make = (name) =>
  function Icon({ size = 24, color = "currentColor", strokeWidth = 2, style, ...rest }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} aria-hidden="true" {...rest}>
        {P[name]}
      </svg>
    );
  };

export const Plus = make("Plus"), ChevronRight = make("ChevronRight"), FileText = make("FileText"),
  X = make("X"), Trash2 = make("Trash2"), ArrowLeft = make("ArrowLeft"), Check = make("Check"),
  Clock = make("Clock"), Send = make("Send"), Mic = make("Mic"), MapPin = make("MapPin"),
  Bell = make("Bell"), Search = make("Search"), Phone = make("Phone"), LocateFixed = make("LocateFixed"),
  AlertCircle = make("AlertCircle"), AlertTriangle = make("AlertTriangle"), Home = make("Home"),
  Stethoscope = make("Stethoscope"), MessageCircle = make("MessageCircle"), FolderHeart = make("FolderHeart"),
  LogOut = make("LogOut"), Sun = make("Sun"), Moon = make("Moon"), Shield = make("Shield"),
  Pill = make("Pill"), Pulse = make("Pulse"), Arrow = make("Arrow"),
  Camera = make("Camera"), Video = make("Video"), Play = make("Play"), Pause = make("Pause"),
  SkipBack = make("SkipBack"), SkipForward = make("SkipForward"), Volume = make("Volume"),
  FirstAid = make("FirstAid"), Refresh = make("Refresh"), Info = make("Info"), Download = make("Download"), Offline = make("Offline");
