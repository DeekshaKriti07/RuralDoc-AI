// Symptom checker pipeline:
//   read the person's words/answers/photos  ->  deterministic differential engine  ->  safe, translated assessment.
// The model reads language and images; it never picks the diagnosis list or the urgency on its own.
const { checkRedFlags } = require('./redFlagDetector');
const E = require('./triage/engine');
const { extract } = require('./triage/extract');
const { analyzeImages } = require('./triage/media');
const { LABELS, URGENCY_LINE } = require('./triage/ui');
const { translateMany } = require('./translate');
const { emergencyMessage } = require('./languages');
const firstAid = require('./knowledge/firstaid');
const { search } = require('./knowledge/search');

// Translate a nested bundle of strings in one pass.
async function localize(language, strings) {
  const { strings: out } = await translateMany(strings, language);
  return out;
}

async function buildLabels(language, keys) {
  const out = await localize(language, keys.map((k) => LABELS[k]));
  return Object.fromEntries(keys.map((k, i) => [k, out[i]]));
}

async function questionsOut(questions, language) {
  const flat = [];
  questions.forEach((q) => { flat.push(q.text); q.options.forEach(([, label]) => flat.push(label)); });
  const t = await localize(language, flat);
  let i = 0;
  return questions.map((q) => {
    const text = t[i++];
    return { id: q.id, type: q.type, text, options: q.options.map(([value]) => ({ value, label: t[i++] })) };
  });
}

function mediaPublic(m) { return m ? { category: m.category, body_area: m.body_area, findings: m.visible_findings, severity_clues: m.severity_clues, looks_urgent: m.looks_urgent, quality: m.photo_quality, summary: m.summary } : null; }

async function runSymptomCheck({ message = '', answers = [], state: stateIn, images = [], language = 'en', force = false, records = [], meds = [] }) {
  let state = E.mergeExtraction(E.emptyState(), {});
  if (stateIn) state = E.mergeExtraction(E.applyAnswers(stateIn, []), {});
  state.redflag = !!(stateIn && stateIn.redflag);
  const textSoFar = [...(state.english || []), message].join(' ');

  // 1. photos or video frames
  let media = null, mediaFailed = false;
  if (images && images.length) {
    try {
      media = await analyzeImages(images, message);
      if (media) {
        state.media = [...(state.media || []), { summary: media.summary, category: media.category }].slice(-3);
        state = E.mergeExtraction(state, { present: media.symptoms });
        if (media.looks_urgent && media.symptoms.includes('inj_bleeding')) state.redflag = true;
      }
    } catch (err) { console.warn('Photo analysis failed:', err.message); mediaFailed = true; }
  }

  // 2. tapped answers (chips), then free text
  state = E.applyAnswers(state, answers);
  if (message && message.trim()) {
    const ext = await extract(message);
    state = E.mergeExtraction(state, ext);
  }
  if (checkRedFlags(message).isEmergency) state.redflag = true;

  // 3. decide: ask more, or assess
  const res = E.step(state, { records, meds, force: force || state.redflag });
  state = res.state;
  const base = { state, media: mediaPublic(media), media_failed: mediaFailed };

  if (res.status === 'need_description' && !state.redflag) {
    const L = await buildLabels(language, ['need_description', 'media_failed']);
    return { ...base, status: 'need_description', message: media && media.photo_quality === 'poor' ? L.media_failed : L.need_description };
  }

  if (res.status === 'need_more_info') {
    const [questions, L] = await Promise.all([questionsOut(res.questions, language), buildLabels(language, ['intro_questions'])]);
    return { ...base, status: 'need_more_info', message: L.intro_questions, questions, round: state.rounds };
  }

  // assessment
  const a = E.assess(state, res.ranked, res.rc, state.redflag);
  let faIds = [...a.first_aid];
  if (state.redflag || a.urgency_level === 'emergency') faIds = [...new Set([...faIds, ...firstAid.matchText(textSoFar, 2).map((g) => g.id)])];
  const first_aid = faIds.filter(firstAid.isValid).slice(0, 4).map((id) => firstAid.ref(id));

  const top = a.possible_causes[0];
  const symptomList = state.present.filter((s) => !s.startsWith('ctx_') && !s.startsWith('inj_'));
  const summaryEn = state.redflag && !top
    ? emergencyMessage('en')
    : `${top ? `Your symptoms most closely match: ${top.name}. ` : ''}${URGENCY_LINE[a.urgency_level]}`;

  // everything the user will read gets translated in one batch
  const flat = [];
  const push = (s) => { flat.push(s); return flat.length - 1; };
  const idx = {
    summary: push(summaryEn),
    causes: a.possible_causes.map((c) => ({ name: push(c.name), matched: c.matched.map(push), tell: c.to_tell_apart.map(push) })),
    red: a.red_flags.map(push), care: a.self_care.map(push), doc: a.see_doctor_if.map(push), notes: a.record_notes.map(push),
    media: media ? [...media.visible_findings.map(push), ...media.severity_clues.map(push)] : [],
    faWhy: first_aid.map((g) => push(g.why)),
  };
  const [t, L] = await Promise.all([
    localize(language, flat),
    buildLabels(language, ['possible_causes', 'most_likely', 'possible', 'less_likely', 'matched', 'to_tell_apart', 'red_flags', 'self_care', 'see_doctor_if', 'first_aid', 'records', 'for_doctor', 'photo', 'photo_note', 'disclaimer', 'urgency_emergency', 'urgency_see_doctor', 'urgency_monitor']),
  ]);

  const assessment = {
    urgency_level: a.urgency_level,
    urgency_label: L[`urgency_${a.urgency_level}`],
    summary: t[idx.summary],
    confidence: a.top_confidence,
    possible_causes: a.possible_causes.map((c, i) => ({
      id: c.id, name: t[idx.causes[i].name], likelihood: c.likelihood, share: c.share,
      matched: idx.causes[i].matched.map((k) => t[k]), to_tell_apart: idx.causes[i].tell.map((k) => t[k]),
    })),
    red_flags: idx.red.map((k) => t[k]), self_care: idx.care.map((k) => t[k]), see_doctor_if: idx.doc.map((k) => t[k]),
    record_notes: idx.notes.map((k) => t[k]),
    first_aid: first_aid.map((g, i) => ({ id: g.id, title: g.title, emergency: g.emergency, why: t[idx.faWhy[i]] })),
    what_to_tell_doctor: a.what_to_tell_doctor,
    photo_lines: idx.media.map((k) => t[k]),
    labels: L,
    symptoms_used: symptomList.length,
    show_hospital_search: a.urgency_level !== 'monitor',
  };

  // supporting reading from the offline knowledge base (MedQuAD etc.)
  const query = [top && top.name, ...symptomList.slice(0, 4).map((s) => require('./knowledge/clinical').label(s))].filter(Boolean).join(' ');
  let sources = [];
  try { sources = search(query, 3).map((d) => ({ title: d.title, source: d.source, url: d.url || null })); } catch { /* optional */ }

  return { ...base, status: 'assessment', assessment, sources };
}

module.exports = { runSymptomCheck };
