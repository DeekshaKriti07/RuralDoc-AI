import { useState } from "react";
import "../features.css";
import { RuralDocMark } from "../components/Marks";
import ChatShell from "../components/ChatShell";
import { SpeakBtn } from "../components/VoiceUI";
import { GuideLinks } from "../components/AssessmentCard";
import { MediaAttach, MediaPreview, useMedia } from "../components/MediaPicker";
import { useVoice } from "../useVoice";
import { apiRequest } from "../api";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function ChatScreen({ onOpenGuide }) {
  const voice = useVoice();
  const media = useMedia();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const send = async (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    const images = media.images;
    if ((!text && !images.length) || loading) return;
    setMessages((m) => [...m, { id: uid(), role: "user", content: text || "(photo)", thumbs: media.items.map((i) => i.preview) }]);
    setInput(""); media.clear();
    setLoading(true);
    const id = uid();
    try {
      const r = await apiRequest("/ai/chat", { method: "POST", body: JSON.stringify({ message: text, images, conversation_id: conversationId, language: voice.lang.split("-")[0] }) });
      setConversationId(r.conversation_id);
      setMessages((m) => [...m, { id, role: "assistant", content: r.reply, emergency: r.emergency, first_aid: r.first_aid || [], sources: r.sources || [], media: r.media }]);
      if (voice.autoSpeak) voice.speak(r.reply, id);
    } catch (err) {
      setMessages((m) => [...m, { id, role: "assistant", content: err.message || "Chat is currently unavailable. Please try again shortly.", error: true }]);
    } finally { setLoading(false); }
  };

  return (
    <ChatShell title="Ask RuralDoc" sub="Health questions in your language. You can add a photo or video." accent="#8aa4ff" voice={voice}
      input={input} setInput={setInput} onSend={send} loading={loading || media.busy}
      placeholder={`Ask in ${voice.info.name}, or add a photo…`} trigger={messages.length}
      attach={<MediaAttach media={media} />} preview={<MediaPreview media={media} />}>
      <div className="ap-m">
        <span className="ap-av"><RuralDocMark size={18} color="#0a1230" /></span>
        <div className="ap-b ai"><p>{voice.info.chat}</p><SpeakBtn voice={voice} id="hello" text={voice.info.chat} /></div>
      </div>
      {messages.map((m) => (
        <div key={m.id} className={`ap-m ${m.role === "user" ? "u" : ""}`}>
          {m.role === "assistant" && <span className="ap-av"><RuralDocMark size={18} color="#0a1230" /></span>}
          <div className={`ap-b ${m.role === "user" ? "me" : m.emergency || m.error ? "ai em" : "ai"}`}>
            {m.thumbs && m.thumbs.length > 0 && <div className="md-inline">{m.thumbs.map((t, i) => <img key={i} src={t} alt="" />)}</div>}
            <p>{m.content}</p>
            {m.media && m.media.summary && <p className="rec">Photo: {m.media.summary}</p>}
            {m.media && m.media.failed && <p className="rec">I could not read the photo.</p>}
            {m.role === "assistant" && !m.error && <SpeakBtn voice={voice} id={m.id} text={m.content} />}
            {m.first_aid && m.first_aid.length > 0 && <GuideLinks items={m.first_aid} onOpen={onOpenGuide} title="Offline first-aid guide" />}
            {m.sources && m.sources.length > 0 && <small className="as-src">Reference reading: {[...new Set(m.sources.map((s) => s.title))].join(" · ")}</small>}
          </div>
        </div>
      ))}
    </ChatShell>
  );
}
