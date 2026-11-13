import { Mic } from "./Icons";
import { LANGS } from "../useVoice";

const Spk = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
);
const Stop = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
);

export function LangPicker({ voice }) {
  return (
    <div className="vo-bar">
      <select className="vo-sel" value={voice.lang} onChange={(e) => voice.setLang(e.target.value)} aria-label="Language">
        {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native} · {l.name}</option>)}
      </select>
      <button type="button" className={`vo-tog ${voice.autoSpeak ? "on" : ""}`} onClick={() => voice.setAutoSpeak(!voice.autoSpeak)}>
        <span className="vo-sw" />Read replies aloud
      </button>
    </div>
  );
}

export function MicButton({ voice, onFinal }) {
  return (
    <button type="button" className={`ap-mic ${voice.listening ? "live" : ""}`}
      title={voice.listening ? "Tap to stop" : `Speak in ${voice.info.name}`}
      onClick={() => (voice.listening ? voice.stop() : voice.start(onFinal))}>
      <Mic size={18} />
    </button>
  );
}

export function SpeakBtn({ voice, id, text, lang }) {
  if (!voice.canSpeak || !text) return null;
  const on = voice.speakingId === id;
  return (
    <button type="button" className={`vo-spk ${on ? "on" : ""}`} title={on ? "Stop" : "Listen"}
      onClick={() => (on ? voice.stopSpeak() : voice.speak(text, id, lang))}>
      {on ? <Stop /> : <Spk />}
    </button>
  );
}

export function VoiceNotice({ voice }) {
  const msg = voice.error || voice.voiceHelp;
  if (!msg) return null;
  return <div className={`vo-notice ${voice.error ? "err" : ""}`}>{msg}</div>;
}

export function LiveTranscript({ voice }) {
  if (!voice.listening) return null;
  return (
    <div className="vo-live">
      <span className="vo-wave"><i /><i /><i /><i /></span>
      <span>{voice.interim || `Listening in ${voice.info.name}… speak now`}</span>
    </div>
  );
}