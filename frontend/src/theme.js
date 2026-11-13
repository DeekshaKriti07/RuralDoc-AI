const shared = {
  primary: "#1D4235",
  primaryDeep: "#123024",
  sage: "#EAF5EB",
  paper: "#FFFDF8",
  apricot: "#F4C878",
  indigo: "#748CAF",
  urgent: "#C0392B",
};

export const lightTheme = {
  ...shared,
  bg: "#F8FBF8",
  bgGradient: "radial-gradient(circle at 85% 0%, rgba(215,244,224,0.72), transparent 28rem), radial-gradient(circle at 0% 35%, rgba(232,244,255,0.5), transparent 24rem), #F8FBF8",
  surface: "#F4EFE5",
  surfaceSoft: "#EAF5EB",
  surfaceGlass: "rgba(244,239,229,0.85)",
  ink: "#17342E",
  inkSoft: "#6B8279",
  line: "#DFEBE2",
  primaryTint: "#EAF5EB",
  apricotTint: "#FFF6DF",
  apricotInk: "#8D672B",
  indigoTint: "#EEF1F8",
  indigoInk: "#3E5470",
  urgentTint: "#FBE3DF",
  shadowSoft: "0 16px 40px rgba(34,90,62,0.09)",
  shadowCard: "0 10px 30px rgba(34,90,62,0.045)",
  shadow3d: "0 10px 24px rgba(23,52,46,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
};

export const darkTheme = {
  ...shared,
  bg: "#0C1916",
  bgGradient: "radial-gradient(circle at 85% 0%, rgba(35,111,79,0.22), transparent 28rem), radial-gradient(circle at 0% 35%, rgba(52,86,122,0.16), transparent 24rem), #0C1916",
  surface: "#182D25",
  surfaceSoft: "#17382B",
  surfaceGlass: "rgba(24,45,37,0.85)",
  ink: "#E7F3EB",
  inkSoft: "#9BB5A8",
  line: "#29463B",
  primaryTint: "#17382B",
  apricotTint: "#3A3020",
  apricotInk: "#E8C779",
  indigoTint: "#202D3B",
  indigoInk: "#A9BEDD",
  urgentTint: "#3A201C",
  shadowSoft: "0 16px 42px rgba(0,0,0,0.3)",
  shadowCard: "0 12px 32px rgba(0,0,0,0.18)",
  shadow3d: "0 10px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export const FONT_HEAD = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_BODY = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";