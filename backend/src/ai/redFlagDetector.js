// Keyword-based emergency detection. Runs BEFORE the AI so a wrong/missed AI
// answer can never suppress an emergency warning. Deliberately broad:
// false positives are far safer than false negatives.
// NOTE: regional-language lists are a starting point. Have a native speaker /
// clinician review them and add local spellings before real-world use.

const ENGLISH = [
  /chest pain/i, /chest tightness/i, /can'?t breathe/i, /difficulty breathing/i,
  /shortness of breath/i, /severe bleeding/i, /heavy bleeding/i, /won'?t stop bleeding/i,
  /unconscious/i, /not responding/i, /fainted/i, /seizure/i, /convulsion/i,
  /stroke/i, /face drooping/i, /slurred speech/i, /can'?t move (my|one) (arm|side|leg)/i,
  /severe allergic/i, /throat closing/i, /swelling of (the )?(face|throat|tongue)/i,
  /suicidal/i, /want to die/i, /end my life/i, /overdose/i, /poisoning/i,
  /severe abdominal pain/i, /coughing blood/i, /vomiting blood/i,
  /high fever.*(baby|infant|newborn)/i, /baby.*not moving/i, /baby.*not breathing/i,
];

// Written as strings, then NFC-normalised, so speech-to-text spellings match.
const REGIONAL = [
  // Hindi / Hinglish
  'सीने (में )?(तेज |बहुत )?दर्द', 'छाती (में )?दर्द', 'सांस (नहीं|लेने में)', 'साँस (नहीं|लेने में)', 'दम घुट',
  'बेहोश', 'दौरा पड', 'दिल का दौरा', 'मिर्गी', 'खून (बह|की उल्टी|की खांसी|की खाँसी)', 'लकवा',
  'आत्महत्या', 'मरना चाहत', 'ज\\u093C?हर (खा|पी)',
  'seene (mein|me) dard', 'saans (nahi|lene mein)', 'behosh',
  // Tamil / Tanglish
  'நெஞ்சு வலி', 'நெஞ்சில் வலி', 'மூச்சு (விட|திணறல்)', 'மூச்சுத் ?திணறல்', 'மயங்கி', 'மயக்கம் (போட|அடை)',
  'வலிப்பு', '(இ|ர)த்தப் ?போக்கு', '(இ|ர)த்த வாந்தி', 'தற்கொலை', 'விஷம்',
  'nenju vali', 'moochu (thinaral|vida mudiyala)',
  // Telugu
  'ఛాతీ(లో)? నొప్పి', 'ఊపిరి (ఆడ|తీసుకోవడం)', 'స్పృహ (తప్పి|కోల్పో)', 'మూర్ఛ', 'రక్తస్రావం', 'రక్తం (వాంతి|కక్కు)', 'ఆత్మహత్య', 'విషం',
  // Kannada
  'ಎದೆ ?ನೋವು', 'ಉಸಿರಾಟ(ದ)? ತೊಂದರೆ', 'ಉಸಿರಾಡಲು', 'ಪ್ರಜ್ಞೆ (ತಪ್ಪ|ಕಳೆದ)', 'ಅಪಸ್ಮಾರ', 'ಫಿಟ್ಸ್', 'ರಕ್ತಸ್ರಾವ', 'ರಕ್ತ ವಾಂತಿ', 'ಆತ್ಮಹತ್ಯೆ',
  // Malayalam
  'നെഞ്ച് ?വേദന', 'ശ്വാസം (മുട്ട്|എടുക്ക)', 'ബോധം (പോയ|നഷ്ട)', 'അപസ്മാരം', 'ഫിറ്റ്സ്', 'രക്തസ്രാവം', 'രക്തം ഛർദ്ദ', 'ആത്മഹത്യ', 'വിഷം',
  // Bengali
  'বুকে ব্যথা', 'শ্বাস (নিতে|কষ্ট)', 'অজ্ঞান', 'খিঁচুনি', 'রক্তক্ষরণ', 'রক্তপাত', 'রক্তবমি', 'আত্মহত্যা',
  // Marathi
  'छातीत (दुखत|दुखणे|वेदना)', 'श्वास (घेता येत नाही|घ्यायला त्रास)', 'बेशुद्ध', 'झटका|झटके', 'रक्तस्राव', 'रक्ताची उलटी', 'आत्महत्या',
  // Gujarati
  'છાતીમાં દુખાવો', 'શ્વાસ (લઈ શકતા નથી|લેવામાં તકલીફ)', 'બેભાન', 'આંચકી', 'લોહી (નીકળ|વહે)', 'રક્તસ્રાવ', 'લોહીની ઉલટી', 'આત્મહત્યા', 'ઝેર (પી|ખા)',
  // Punjabi
  'ਛਾਤੀ (ਵਿੱਚ|ਚ|ਵਿਚ) ਦਰਦ', 'ਸਾਹ (ਨਹੀਂ|ਲੈਣ)', 'ਬੇਹੋਸ਼', 'ਦੌਰਾ', 'ਮਿਰਗੀ', 'ਖੂਨ (ਵਗ|ਦੀ ਉਲਟੀ)', 'ਖੁਦਕੁਸ਼ੀ',
].map((s) => new RegExp(s.normalize('NFC'), 'i'));

const RED_FLAG_PATTERNS = [...ENGLISH, ...REGIONAL];

function checkRedFlags(inputText) {
  const text = String(inputText || '').normalize('NFC');
  const matched = RED_FLAG_PATTERNS.filter((p) => p.test(text));
  return { isEmergency: matched.length > 0, matchedCount: matched.length };
}

module.exports = { checkRedFlags };