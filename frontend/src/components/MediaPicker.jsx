// Attach photos or a short video. Everything is shrunk and read in the browser, so only a few small frames are sent
// to your own server (no cloud upload). Videos are analysed as 4 still frames.
import { useRef, useState, useCallback } from "react";
import { Camera, X } from "./Icons";

const MAX_SIDE = 768, MAX_IMAGES = 4, MAX_VIDEO_MB = 80;

function toJpeg(source, w, h) {
  const s = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
  c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.72);
}

async function readImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const d = toJpeg(img, img.naturalWidth, img.naturalHeight);
    return { kind: "image", preview: d, frames: [d] };
  } finally { URL.revokeObjectURL(url); }
}

async function readVideo(file) {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("video")); setTimeout(() => rej(new Error("timeout")), 15000); });
    const dur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 1;
    const frames = [];
    for (let i = 0; i < 4; i++) {
      const t = Math.min(Math.max(dur - 0.05, 0.01), Math.max(0.05, (dur * (i + 0.5)) / 4));
      await new Promise((res) => { v.onseeked = res; v.currentTime = t; setTimeout(res, 3000); });
      frames.push(toJpeg(v, v.videoWidth || 640, v.videoHeight || 480));
    }
    return { kind: "video", preview: frames[0], frames };
  } finally { URL.revokeObjectURL(url); }
}

export function useMedia() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = useCallback(async (fileList) => {
    setError("");
    setBusy(true);
    try {
      for (const f of Array.from(fileList || [])) {
        try {
          if (f.type.startsWith("image/")) {
            const it = await readImage(f);
            setItems((cur) => (cur.length >= MAX_IMAGES ? cur : [...cur, { id: Math.random().toString(36).slice(2), ...it }]));
          } else if (f.type.startsWith("video/")) {
            if (f.size > MAX_VIDEO_MB * 1024 * 1024) { setError(`That video is too large (limit ${MAX_VIDEO_MB} MB). Please record a shorter clip.`); continue; }
            const it = await readVideo(f);
            setItems((cur) => [...cur, { id: Math.random().toString(36).slice(2), ...it }]);
          } else setError("Please choose a photo or a video.");
        } catch { setError("Could not read that file. Try a different photo or video."); }
      }
    } finally { setBusy(false); }
  }, []);

  const remove = (id) => setItems((cur) => cur.filter((x) => x.id !== id));
  const clear = () => { setItems([]); setError(""); };
  // at most 4 images are sent in total: 1 per photo, up to 3 frames per video
  const images = items.flatMap((it) => (it.kind === "video" ? it.frames.slice(0, items.length > 1 ? 2 : 4) : it.frames)).slice(0, MAX_IMAGES);
  return { items, images, busy, error, add, remove, clear };
}

export function MediaAttach({ media }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { media.add(e.target.files); e.target.value = ""; }} />
      <button type="button" className="ap-mic" title="Add a photo or video" onClick={() => ref.current?.click()}><Camera size={18} /></button>
    </>
  );
}

export function MediaPreview({ media }) {
  if (!media.items.length && !media.busy && !media.error) return null;
  return (
    <div className="md-strip">
      {media.items.map((it) => (
        <div key={it.id} className="md-thumb">
          <img src={it.preview} alt="" />
          <span>{it.kind === "video" ? "Video" : "Photo"}</span>
          <button type="button" onClick={() => media.remove(it.id)} aria-label="Remove"><X size={12} /></button>
        </div>
      ))}
      {media.busy && <div className="md-note">Preparing…</div>}
      {media.error && <div className="md-note err">{media.error}</div>}
      {media.items.length > 0 && <div className="md-note">The AI will look at {media.images.length} image{media.images.length > 1 ? "s" : ""}. A photo cannot confirm a diagnosis.</div>}
    </div>
  );
}
