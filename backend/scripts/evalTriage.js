#!/usr/bin/env node
// Offline self-test for the triage engine. Run:  node scripts/evalTriage.js
// Each case is a realistic symptom set -> the condition a clinician would expect near the top.
// Add your own cases (ideally written by a doctor) to keep measuring accuracy as you improve the knowledge base.
const E = require('../src/ai/triage/engine');

const S = (s) => s.split(' ').filter(Boolean);
// [name, present, absent, who, days, expectedTop3 (any of), mustBeEmergency]
const CASES = [
  ['Common cold', 'runny_nose sneezing sore_throat cough', 'high_fever', 'adult', 2, ['common_cold']],
  ['Flu', 'fever body_ache chills headache cough fatigue', '', 'adult', 2, ['influenza']],
  ['Dengue', 'high_fever retro_orbital_pain body_ache joint_pain headache ctx_mosquito', 'cough', 'adult', 3, ['dengue']],
  ['Malaria', 'fever chills sweating headache ctx_mosquito', 'cough', 'adult', 3, ['malaria']],
  ['Typhoid', 'fever headache abdominal_pain loss_of_appetite constipation', 'cough', 'adult', 6, ['typhoid']],
  ['Gastroenteritis', 'diarrhoea vomiting abdominal_cramps nausea ctx_contaminated', '', 'adult', 1, ['gastroenteritis']],
  ['Child dehydration', 'diarrhoea sunken_eyes very_sleepy no_urine', '', 'child', 1, ['dehydration', 'gastroenteritis', 'cholera_like'], true],
  ['Acidity', 'heartburn upper_abdominal_pain bloating', 'chest_pain', 'adult', 10, ['gastritis_reflux']],
  ['Appendicitis', 'right_lower_abdominal_pain nausea fever loss_of_appetite', '', 'adult', 1, ['appendicitis'], true],
  ['Jaundice', 'jaundice dark_urine nausea loss_of_appetite fatigue', '', 'adult', 8, ['jaundice_hepatitis']],
  ['UTI', 'burning_urination frequent_urination abdominal_pain', 'fever', 'adult', 2, ['uti']],
  ['Kidney stone', 'flank_pain nausea vomiting blood_urine', '', 'adult', 1, ['kidney_stone']],
  ['High sugar', 'increased_thirst frequent_urination fatigue weight_loss blurred_vision', '', 'adult', 20, ['diabetes_high_sugar']],
  ['Low sugar', 'sweating tremor hunger dizziness ctx_known_diabetes', '', 'adult', 0.5, ['hypoglycemia']],
  ['Heart attack', 'chest_pain pain_spreading_arm sweating shortness_of_breath nausea', '', 'elderly', 0.5, ['heart_attack'], true],
  ['Stroke', 'facial_droop arm_weakness speech_difficulty', '', 'elderly', 0.2, ['stroke'], true],
  ['Tension headache', 'headache fatigue sleep_problem', 'fever neck_stiffness', 'adult', 2, ['tension_headache']],
  ['Migraine', 'headache_one_sided nausea light_sensitivity', '', 'adult', 1, ['migraine']],
  ['Meningitis', 'fever severe_headache neck_stiffness light_sensitivity vomiting', '', 'child', 1, ['meningitis'], true],
  ['Vertigo', 'spinning dizziness nausea', 'severe_headache', 'adult', 1, ['vertigo']],
  ['Anaemia', 'fatigue pale_skin dizziness shortness_of_breath', 'fever', 'adult', 30, ['anaemia']],
  ['Pneumonia', 'cough fever shortness_of_breath fast_breathing productive_cough', '', 'child', 4, ['pneumonia']],
  ['Asthma', 'wheezing shortness_of_breath chest_tightness cough ctx_known_asthma', 'fever', 'adult', 0.5, ['asthma']],
  ['TB', 'cough_2weeks weight_loss night_sweats fever blood_cough', '', 'adult', 30, ['tuberculosis']],
  ['Tonsillitis', 'sore_throat difficulty_swallowing fever swollen_glands', 'cough runny_nose', 'child', 2, ['pharyngitis']],
  ['Sinusitis', 'facial_pain blocked_nose runny_nose headache', '', 'adult', 8, ['sinusitis']],
  ['Ear infection', 'ear_pain fever', '', 'child', 1, ['ear_infection']],
  ['Pink eye', 'red_eye eye_discharge', '', 'adult', 2, ['conjunctivitis']],
  ['Scabies', 'itching_night itching rash ctx_close_contact_itch', '', 'child', 14, ['scabies']],
  ['Ringworm', 'ring_rash itching', '', 'adult', 10, ['ringworm']],
  ['Hives', 'hives itching', 'shortness_of_breath', 'adult', 0.5, ['urticaria']],
  ['Anaphylaxis', 'throat_swelling shortness_of_breath hives dizziness', '', 'adult', 0.1, ['anaphylaxis'], true],
  ['Chickenpox', 'rash_blisters fever itching', '', 'child', 2, ['chickenpox']],
  ['Measles', 'fever rash cough runny_nose red_eye', '', 'child', 4, ['measles']],
  ['Boil', 'skin_pus skin_infection_signs', '', 'adult', 3, ['skin_abscess']],
  ['Back pain', 'back_pain injury_pain', 'numbness', 'adult', 3, ['back_strain']],
  ['Sprain', 'inj_sprain injury_pain joint_swelling', '', 'adult', 0.5, ['sprain']],
  ['Fracture', 'inj_fracture deformity injury_pain cannot_bear_weight', '', 'adult', 0.1, ['fracture'], true],
  ['Snakebite', 'inj_snakebite', '', 'adult', 0.1, ['snakebite'], true],
  ['Dog bite', 'inj_animal_bite', '', 'child', 0.1, ['animal_bite']],
  ['Heat stroke', 'inj_heat ctx_outdoor_heat confusion high_fever dizziness', '', 'adult', 0.2, ['heat_illness'], true],
  ['Burn', 'inj_burn', '', 'adult', 0.1, ['burn_injury']],
  ['Pregnancy bleeding', 'vaginal_bleeding abdominal_pain', '', 'pregnant', 0.2, ['pregnancy_warning'], true],
  ['Period pain', 'painful_periods abdominal_cramps', '', 'adult', 1, ['menstrual_cramps']],
  ['Depression', 'low_mood sleep_problem fatigue loss_of_appetite', '', 'adult', 30, ['depression']],
  ['Infant with fever', 'fever runny_nose', '', 'infant', 1, ['common_cold', 'influenza'], true],
];

let top1 = 0, top3 = 0, safe = 0, safeTotal = 0;
const misses = [];
for (const [name, p, a, who, days, expect, mustEmergency] of CASES) {
  const st = E.mergeExtraction(E.emptyState(), { present: S(p), absent: S(a), who, duration_days: days });
  const r = E.step({ ...st, rounds: 3 }, { force: true });
  const ids = r.ranked.map((x) => x.c.id);
  const hit1 = expect.includes(ids[0]), hit3 = ids.slice(0, 3).some((i) => expect.includes(i));
  if (hit1) top1++; if (hit3) top3++;
  if (!hit3) misses.push(`${name}: expected ${expect[0]}, got ${ids.slice(0, 3).join(', ') || 'nothing'}`);
  if (mustEmergency) {
    safeTotal++;
    const as = E.assess(r.state, r.ranked, r.rc);
    if (as.urgency_level === 'emergency') safe++; else misses.push(`SAFETY: ${name} gave urgency "${as.urgency_level}" (should be emergency)`);
  }
}
const n = CASES.length;
console.log(`Cases: ${n}`);
console.log(`Correct condition ranked #1:        ${top1}/${n} (${Math.round((100 * top1) / n)}%)`);
console.log(`Correct condition in top 3:         ${top3}/${n} (${Math.round((100 * top3) / n)}%)`);
console.log(`Emergencies correctly flagged:      ${safe}/${safeTotal}`);
if (misses.length) console.log('\nMisses:\n - ' + misses.join('\n - '));

// ---- Harder test 1: one symptom is missing from what the patient reports ---------------------
let loo = 0, looN = 0;
for (const [, p, a, who, days, expect] of CASES) {
  const syms = S(p);
  if (syms.length < 3) continue;
  for (let i = 0; i < syms.length; i++) {
    const sub = syms.filter((_, j) => j !== i);
    const st = E.mergeExtraction(E.emptyState(), { present: sub, absent: S(a), who, duration_days: days });
    const r = E.step({ ...st, rounds: 3 }, { force: true });
    looN++;
    if (r.ranked.slice(0, 3).some((x) => expect.includes(x.c.id))) loo++;
  }
}
console.log(`\nWith one reported symptom missing:  ${loo}/${looN} in top 3 (${Math.round((100 * loo) / looN)}%)`);

// ---- Harder test 2: simulated conversation. Patient first mentions only 2 symptoms, then answers
// every follow-up question truthfully. Measures whether the question loop finds the right condition.
let simHit = 0, simN = 0, rounds = 0;
for (const [, p, , who, days, expect] of CASES) {
  const truth = new Set(S(p));
  const first = S(p).slice(0, 2);
  let st = E.mergeExtraction(E.emptyState(), { present: first });
  let res = E.step(st);
  let guard = 0;
  while (res.status === 'need_more_info' && guard++ < 6) {
    const answers = res.questions.map((q) => q.id === 'who' ? { id: 'who', value: who }
      : q.id === 'duration' ? { id: 'duration', value: days < 1 ? 'lt1' : days <= 3 ? 'd1_3' : days <= 7 ? 'd4_7' : days <= 14 ? 'gt7' : 'gt14' }
      : { id: q.id, value: truth.has(q.id) ? 'yes' : 'no' });
    st = E.applyAnswers(res.state, answers);
    res = E.step(st);
  }
  simN++; rounds += res.state.rounds;
  if (res.ranked.slice(0, 3).some((x) => expect.includes(x.c.id))) simHit++;
}
console.log(`Simulated question-and-answer chats: right condition in top 3 in ${simHit}/${simN} (${Math.round((100 * simHit) / simN)}%), avg ${(rounds / simN).toFixed(1)} question rounds`);

process.exit(misses.some((m) => m.startsWith('SAFETY')) ? 1 : 0);
