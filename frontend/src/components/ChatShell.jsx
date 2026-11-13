import { useEffect, useRef } from "react";
import { Send } from "./Icons";
import { LangPicker, MicButton, LiveTranscript, VoiceNotice } from "./VoiceUI";

// attach: node shown left of the input (camera button). preview: node shown above the input (photo thumbnails). footer: extra node under the messages.
export default function ChatShell({ title, sub, accent = "#3ddc97", children, input, setInput, onSend, loading, placeholder, trigger, voice, attach, preview, headerExtra, sendDisabled }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [trigger, loading]);
  return (
    <div className="ap-chat" style={{ "--acc": accent }}>
      <header className="ap-chat-h">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div><h1>{title}</h1><p><i />{sub}</p></div>
          {headerExtra}
        </div>
        {voice && <LangPicker voice={voice} />}
      </header>
      {voice && <VoiceNotice voice={voice} />}
      <div className="ap-msgs">
        {children}
        {loading && <div className="ap-m"><span className="ap-av" /><div className="ap-b ai"><span className="ap-dots"><i /><i /><i /></span></div></div>}
        <div ref={end} />
      </div>
      <div className="ap-comp">
        {preview}
        {voice && <LiveTranscript voice={voice} />}
        <div className="ap-comp-in">
          {attach}
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder={placeholder} disabled={loading} />
          {voice && <MicButton voice={voice} onFinal={(t) => onSend(t)} />}
          <button className="ap-send" onClick={() => onSend()} disabled={loading || sendDisabled}><Send size={18} color="#04140e" /></button>
        </div>
      </div>
    </div>
  );
}
