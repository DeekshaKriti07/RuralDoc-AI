// Deterministic differential-diagnosis engine. Same input always gives the same, explainable output.
// The language model only (a) reads the person's words and (b) explains the result; it never decides the ranking.
const { SYMPTOMS, CONDITIONS, INJURY_FIRSTAID, label } = require('../knowledge/clinical');

const URG_RANK = { monitor: 0, see_doctor: 1, emergency: 2 };
const maxUrg = (a, b) => (URG_RANK[a] >= URG_RANK[b] ? a : b);
const DURATION_DAYS = { lt1: 0.5, d1_3: 2, d4_7: 5, gt7: 10, gt14: 21 };

const emptyState = () => ({ present: [], absent: [], asked: [], who: 'unknown', duration_days: null, rounds: 0, english: [], media: [], sex: 'unknown' });

const uniq = (a) => [...new Set(a)];
const clone = (s) => ({ ...emptyState(), ...JSON.parse(JSON.stringify(s || {})) });

function setPresent(st, id) { if (!SYMPTOMS[id]) return; st.absent = st.absent.filter((x) => x !== id); st.present = uniq([...st.present, id]); st.asked = uniq([...st.asked, id]); }
function setAbsent(st, id) { if (!SYMPTOMS[id]) return; st.present = st.present.filter((x) => x !== id); st.absent = uniq([...st.absent, id]); st.asked = uniq([...st.asked, id]); }

function applyAnswers(state, answers = []) {
  const st = clone(state);
  for (const a of answers) {
    if (!a || !a.id) continue;
    if (a.id === 'who') st.who = ['adult', 'child', 'infant', 'elderly', 'pregnant'].includes(a.value) ? a.value : 'unknown';
    else if (a.id === 'duration') st.duration_days = DURATION_DAYS[a.value] ?? st.duration_days;
    else if (a.value === 'yes') setPresent(st, a.id);
    else if (a.value === 'no') setAbsent(st, a.id);
    else if (SYMPTOMS[a.id]) st.asked = uniq([...st.asked, a.id]);
  }
  return st;
}

function mergeExtraction(state, ext = {}) {
  const st = clone(state);
  for (const id of ext.present || []) setPresent(st, id);
  for (const id of ext.absent || []) setAbsent(st, id);
  if (ext.who && ext.who !== 'unknown' && st.who === 'unknown') st.who = ext.who;
  if (ext.sex && ext.sex !== 'unknown') st.sex = ext.sex;
  if (Number.isFinite(ext.duration_days) && st.duration_days == null) st.duration_days = ext.duration_days;
  if (ext.english) st.english = [...st.english, String(ext.english).slice(0, 300)].slice(-4);
  return st;
}

// ---- records -> risk context --------------------------------------------------------------
function readRecords(records = [], meds = []) {
  const text = records.map((r) => `${r.record_type} ${r.title} ${r.details || ''}`).join(' | ').toLowerCase();
  const has = (re) => re.test(text);
  const flags = {
    diabetes: has(/diabet|sugar patient|insulin|metformin/), hypertension: has(/hypertens|high blood pressure|\bbp\b/),
    asthma: has(/asthma|inhaler/), heart: has(/heart|cardiac|angina|bypass/), kidney: has(/kidney|renal|dialysis/),
    tb: has(/tuberculosis|\btb\b/), epilepsy: has(/epilep|seizure/), pregnancy: has(/pregnan|antenatal/), liver: has(/liver|hepatitis|jaundice/),
  };
  const allergies = records.filter((r) => r.record_type === 'allergy').map((r) => r.title);
  const medNames = meds.map((m) => m.medicine_name).filter(Boolean);
  return { flags, allergies, medNames };
}

function recordNotes(rc, top, st) {
  const notes = [];
  if (rc.allergies.length) notes.push(`Your saved allergies: ${rc.allergies.join(', ')}. Tell any doctor or pharmacist before taking a medicine.`);
  if (rc.flags.diabetes && (st.present.includes('fever') || st.present.includes('diarrhoea') || st.present.includes('vomiting'))) notes.push('You have diabetes saved in your records: infections and vomiting can change blood sugar, so check your sugar more often and see a doctor early.');
  if (rc.flags.diabetes && top.some((c) => c.id === 'hypoglycemia')) notes.push('With diabetes, shakiness, sweating or confusion can be low blood sugar. Check your sugar if you can.');
  if (rc.flags.hypertension && (st.present.includes('headache') || st.present.includes('dizziness') || st.present.includes('chest_pain'))) notes.push('You have high blood pressure saved in your records. Check your blood pressure now if you can.');
  if (rc.flags.asthma && (st.present.includes('cough') || st.present.includes('wheezing') || st.present.includes('shortness_of_breath'))) notes.push('You have asthma saved in your records. Keep your reliever inhaler close.');
  if (rc.flags.heart && (st.present.includes('chest_pain') || st.present.includes('shortness_of_breath'))) notes.push('You have a heart condition saved in your records, so chest symptoms should be checked urgently.');
  if (rc.flags.kidney) notes.push('You have a kidney condition saved in your records. Many common medicines are unsafe for kidneys, so ask a doctor before taking any.');
  if (rc.flags.pregnancy) notes.push('Pregnancy is mentioned in your records. Many medicines are unsafe in pregnancy; please see a doctor soon.');
  if (rc.medNames.length) notes.push(`Medicines you currently take (from your reminders): ${rc.medNames.slice(0, 6).join(', ')}. Show this list to the doctor.`);
  return notes;
}

// ---- scoring ------------------------------------------------------------------------------
function rank(st, rc = { flags: {} }) {
  const presentSet = new Set(st.present), absentSet = new Set(st.absent);
  const core = st.present.filter((s) => !s.startsWith('ctx_'));
  const days = st.duration_days;
  const durClass = days == null ? null : days < 3 ? 'acute' : days <= 14 ? 'sub' : 'chronic';
  const out = [];

  for (const c of CONDITIONS) {
    let matched = 0, denied = 0, explained = 0;
    for (const [s, w] of Object.entries(c.syms)) {
      if (presentSet.has(s)) { matched += w; if (!s.startsWith('ctx_')) explained++; }
      else if (absentSet.has(s)) denied += w;
    }
    if (matched === 0) continue;
    const top = Object.values(c.syms).sort((a, b) => b - a).slice(0, 5).reduce((s, v) => s + v, 0);
    let base = (matched - 0.7 * denied) / top;
    if (base <= 0) continue;
    const coverage = core.length ? explained / core.length : 1;
    let score = Math.min(base, 1.2) * (0.55 + 0.45 * coverage) * (0.88 + 0.05 * c.prior);

    const who = c.who[st.who];
    if (who) score *= who;
    if (durClass && c.dur) score *= c.dur === durClass ? 1.15 : (c.dur === 'chronic' && durClass === 'acute') || (c.dur === 'acute' && durClass === 'chronic') ? 0.6 : 0.92;
    const f = rc.flags || {};
    if (c.id === 'hypertension' && f.hypertension) score *= 1.3;
    if (['stroke', 'heart_attack'].includes(c.id) && (f.hypertension || f.heart || f.diabetes)) score *= 1.15;
    if (c.id === 'asthma' && f.asthma) score *= 1.3;
    if (c.id === 'tuberculosis' && f.tb) score *= 1.3;
    if (c.id === 'seizure_epilepsy' && f.epilepsy) score *= 1.3;
    if (c.id === 'pregnancy_warning' && st.who !== 'pregnant' && !f.pregnancy) score *= 0.15;
    if (c.id === 'menstrual_cramps' && ['child', 'infant', 'elderly'].includes(st.who)) score *= 0.2;
    out.push({ c, score, base, matched: Object.keys(c.syms).filter((s) => presentSet.has(s)), denied: Object.keys(c.syms).filter((s) => absentSet.has(s)) });
  }
  out.sort((a, b) => b.score - a.score);
  const top5 = out.slice(0, 5), sum = top5.reduce((s, x) => s + x.score, 0) || 1;
  top5.forEach((x) => { x.pct = x.score / sum; });
  return top5;
}

// ---- next best questions ------------------------------------------------------------------
function pickQuestions(st, ranked, max = 4) {
  const known = new Set([...st.present, ...st.absent, ...st.asked]);
  const cand = ranked.slice(0, 5);
  const value = {};
  for (const r of cand) {
    for (const [s, w] of Object.entries(r.c.syms)) {
      if (known.has(s) || s.startsWith('inj_')) continue;
      const inN = cand.filter((x) => x.c.syms[s]).length;
      const discrim = 1 + 0.6 * (1 - inN / cand.length);
      const safety = r.c.esc.includes(s) ? 0.35 : 0;
      value[s] = (value[s] || 0) + r.pct * ((w / 5) * discrim + safety);
    }
    for (const s of r.c.esc) if (!known.has(s) && SYMPTOMS[s] && !r.c.syms[s]) value[s] = (value[s] || 0) + r.pct * 0.35;
  }
  return Object.entries(value).sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
}

const WHO_Q = { id: 'who', type: 'choice', text: 'Who is unwell?', options: [['adult', 'Adult'], ['child', 'Child (1–12 years)'], ['infant', 'Baby (under 1 year)'], ['elderly', 'Elderly (60+)'], ['pregnant', 'Pregnant woman']] };
const DUR_Q = { id: 'duration', type: 'choice', text: 'How long has this been going on?', options: [['lt1', 'Less than a day'], ['d1_3', '1–3 days'], ['d4_7', '4–7 days'], ['gt7', 'More than a week'], ['gt14', 'More than 2 weeks']] };
const symQ = (id) => ({ id, type: 'yesno', text: SYMPTOMS[id][1], options: [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']] });

// ---- main decision ------------------------------------------------------------------------
function step(stateIn, { records = [], meds = [], force = false } = {}) {
  const st = clone(stateIn);
  const rc = readRecords(records, meds);
  if (rc.flags.diabetes) setPresent(st, 'ctx_known_diabetes');
  if (rc.flags.asthma) setPresent(st, 'ctx_known_asthma');
  const ranked = rank(st, rc);
  const top = ranked[0];

  const realSymptoms = st.present.filter((s) => !s.startsWith('ctx_'));
  if (realSymptoms.length === 0) return { status: 'need_description', state: st, ranked, rc };

  const injuryPresent = st.present.some((s) => s.startsWith('inj_'));
  const strongEmergency = top && top.c.urg === 'emergency' && top.base >= 0.75;
  const confident = top && top.pct >= 0.5 && realSymptoms.length >= 3 && st.rounds >= 1;
  const lastRound = st.rounds >= 3;

  if (force || lastRound || strongEmergency || (injuryPresent && st.rounds >= 1) || confident) {
    return { status: 'assessment', state: st, ranked, rc };
  }

  const questions = [];
  if (st.rounds === 0) {
    if (st.who === 'unknown') questions.push(WHO_Q);
    if (st.duration_days == null) questions.push(DUR_Q);
  }
  for (const id of pickQuestions(st, ranked, st.rounds === 0 ? 3 : 4)) questions.push(symQ(id));
  if (questions.length === 0) return { status: 'assessment', state: st, ranked, rc };

  st.rounds += 1;
  st.asked = uniq([...st.asked, ...questions.filter((q) => q.type === 'yesno').map((q) => q.id)]);
  return { status: 'need_more_info', state: st, ranked, rc, questions };
}

// ---- assessment ---------------------------------------------------------------------------
function assess(st, ranked, rc, redFlagHit = false) {
  const top = ranked.slice(0, 4);
  const presentSet = new Set(st.present);
  const known = new Set([...st.present, ...st.absent]);

  let urgency = top[0] ? top[0].c.urg : 'see_doctor';
  if (top[0] && top[0].c.urg === 'emergency' && top[0].pct < 0.3) urgency = 'see_doctor';
  for (const r of top.slice(0, 3)) {
    if (r.pct >= 0.2 && r.c.esc.some((s) => presentSet.has(s))) urgency = 'emergency';
    if (r.c.urg === 'emergency' && r.pct >= 0.25) urgency = maxUrg(urgency, 'see_doctor');
  }
  if (['infant', 'elderly', 'pregnant'].includes(st.who) && urgency === 'monitor') urgency = 'see_doctor';
  if (st.duration_days != null && st.duration_days >= 14) urgency = maxUrg(urgency, 'see_doctor');
  if (st.duration_days != null && st.duration_days >= 3 && presentSet.has('fever')) urgency = maxUrg(urgency, 'see_doctor');
  if (st.who === 'infant' && presentSet.has('fever')) urgency = 'emergency';
  if (redFlagHit) urgency = 'emergency';

  const lik = (i, pct) => (i === 0 && pct >= 0.4 ? 'most_likely' : pct >= 0.2 ? 'possible' : 'less_likely');
  const causes = top.map((r, i) => ({
    id: r.c.id, name: r.c.name, likelihood: lik(i, r.pct), share: Math.round(r.pct * 100),
    matched: r.matched.filter((s) => !s.startsWith('ctx_')).map(label),
    to_tell_apart: Object.entries(r.c.syms).filter(([s]) => !known.has(s) && !s.startsWith('inj_')).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => label(s)),
    urgency: r.c.urg,
  }));

  const red = uniq(top.slice(0, 2).flatMap((r) => r.c.red)).slice(0, 7);
  const care = uniq(top.slice(0, 2).map((r) => r.c.care).filter(Boolean));
  const doc = uniq(top.slice(0, 2).map((r) => r.c.doc).filter(Boolean));

  const fa = uniq([
    ...st.present.filter((s) => INJURY_FIRSTAID[s]).map((s) => INJURY_FIRSTAID[s]),
    ...top.filter((r) => r.pct >= 0.25 || r.c.urg === 'emergency').flatMap((r) => r.c.fa),
  ]);

  const parts = [];
  if (st.who !== 'unknown') parts.push(`Patient: ${st.who}`);
  if (st.duration_days != null) parts.push(`Duration: about ${st.duration_days < 1 ? 'less than a day' : Math.round(st.duration_days) + ' days'}`);
  parts.push(`Symptoms: ${st.present.filter((s) => !s.startsWith('ctx_')).map(label).join(', ')}`);
  if (st.absent.length) parts.push(`Denied: ${st.absent.map(label).join(', ')}`);
  if (st.media.length) parts.push(`Photo findings: ${st.media.map((m) => m.summary).filter(Boolean).join('; ')}`);

  return {
    urgency_level: urgency, possible_causes: causes, red_flags: red, self_care: care, see_doctor_if: doc,
    first_aid: fa, record_notes: recordNotes(rc, top.map((r) => r.c), st), what_to_tell_doctor: parts.join('. '),
    top_confidence: top[0] ? (top[0].pct >= 0.5 ? 'high' : top[0].pct >= 0.3 ? 'medium' : 'low') : 'low',
  };
}

module.exports = { emptyState, applyAnswers, mergeExtraction, step, assess, rank, readRecords, DURATION_DAYS };
