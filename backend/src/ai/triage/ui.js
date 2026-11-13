// Fixed interface sentences returned by the symptom checker. Written once in English, translated and cached per language.
const LABELS = {
  intro_questions: 'Thank you. To be more accurate, I need a few more details.',
  need_description: 'Please tell me what is bothering you, in your own words.',
  possible_causes: 'What this could be',
  most_likely: 'Most likely',
  possible: 'Possible',
  less_likely: 'Less likely',
  matched: 'Matches your symptoms:',
  to_tell_apart: 'Would help tell them apart:',
  red_flags: 'Go to a hospital immediately if you notice',
  self_care: 'What you can do now',
  see_doctor_if: 'See a doctor if',
  first_aid: 'First aid you can do now',
  records: 'From your health records',
  for_doctor: 'Tell your doctor',
  photo: 'What the photo shows',
  photo_note: 'A photo cannot confirm a diagnosis. Please have a health worker examine it.',
  disclaimer: 'This is health information, not a medical diagnosis. Please consult a healthcare provider.',
  yes: 'Yes', no: 'No', unsure: 'Not sure',
  urgency_emergency: 'Emergency: get medical help now',
  urgency_see_doctor: 'See a doctor soon',
  urgency_monitor: 'Can be cared for at home, watch closely',
  media_failed: 'I could not read the photo. The assessment below uses only what you wrote.',
};
const URGENCY_LINE = {
  emergency: 'These symptoms may be serious. Please get medical help now or call 112. Do not wait.',
  see_doctor: 'Please see a doctor or health worker in the next day or two, sooner if you get worse.',
  monitor: 'This can usually be cared for at home. Watch for the warning signs below.',
};
const LABELS_LIST = Object.keys(LABELS);
module.exports = { LABELS, URGENCY_LINE, LABELS_LIST };
