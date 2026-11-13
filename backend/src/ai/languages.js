// Supported languages for AI replies, plus localized emergency messages.
const LANGS = {
  en: { name: 'English', script: 'English' },
  hi: { name: 'Hindi', script: 'Devanagari script' },
  ta: { name: 'Tamil', script: 'Tamil script' },
  te: { name: 'Telugu', script: 'Telugu script' },
  kn: { name: 'Kannada', script: 'Kannada script' },
  ml: { name: 'Malayalam', script: 'Malayalam script' },
  bn: { name: 'Bengali', script: 'Bengali script' },
  mr: { name: 'Marathi', script: 'Devanagari script' },
  gu: { name: 'Gujarati', script: 'Gujarati script' },
  pa: { name: 'Punjabi', script: 'Gurmukhi script' },
};

const EMERGENCY = {
  en: 'This may be a medical emergency. Please get medical help right now or call 112.',
  hi: 'यह एक मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत डॉक्टर के पास जाएँ या 112 पर कॉल करें।',
  ta: 'இது மருத்துவ அவசரநிலையாக இருக்கலாம். உடனடியாக மருத்துவ உதவியை நாடுங்கள் அல்லது 112 ஐ அழைக்கவும்.',
  te: 'ఇది వైద్య అత్యవసర పరిస్థితి కావచ్చు. వెంటనే వైద్య సహాయం పొందండి లేదా 112 కు కాల్ చేయండి.',
  kn: 'ಇದು ವೈದ್ಯಕೀಯ ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಆಗಿರಬಹುದು. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಪಡೆಯಿರಿ ಅಥವಾ 112 ಗೆ ಕರೆ ಮಾಡಿ.',
  ml: 'ഇത് ഒരു മെഡിക്കൽ അടിയന്തര സാഹചര്യമാകാം. ഉടൻ വൈദ്യസഹായം തേടുക അല്ലെങ്കിൽ 112 ൽ വിളിക്കുക.',
  bn: 'এটি একটি চিকিৎসা জরুরি অবস্থা হতে পারে। অবিলম্বে চিকিৎসকের সাহায্য নিন অথবা ১১২ নম্বরে ফোন করুন।',
  mr: 'ही वैद्यकीय आणीबाणी असू शकते. कृपया ताबडतोब वैद्यकीय मदत घ्या किंवा 112 वर कॉल करा.',
  gu: 'આ તબીબી કટોકટી હોઈ શકે છે. કૃપા કરીને તરત તબીબી મદદ લો અથવા 112 પર કૉલ કરો.',
  pa: 'ਇਹ ਡਾਕਟਰੀ ਐਮਰਜੈਂਸੀ ਹੋ ਸਕਦੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਤੁਰੰਤ ਡਾਕਟਰੀ ਮਦਦ ਲਓ ਜਾਂ 112 ਤੇ ਕਾਲ ਕਰੋ।',
};

function normalizeLang(code) {
  const c = String(code || '').toLowerCase().split(/[-_]/)[0];
  return LANGS[c] ? c : 'en';
}

function emergencyMessage(code) {
  return EMERGENCY[normalizeLang(code)];
}

// Appended at the END of the prompt so the model follows it.
function languageDirective(code) {
  const c = normalizeLang(code);
  const l = LANGS[c];
  if (c === 'en') {
    return '\n\nLANGUAGE REQUIREMENT: Write every string value in the JSON in simple, plain English. Keep the JSON keys in English.';
  }
  return `\n\nLANGUAGE REQUIREMENT: Write every string value in the JSON in ${l.name}, using ${l.script}. ` +
    `Keep the JSON keys in English. Use simple, spoken-style ${l.name} that a villager would understand. ` +
    `Avoid English words unless there is no common ${l.name} word. Do not translate or explain, just answer in ${l.name}.`;
}

module.exports = { LANGS, normalizeLang, emergencyMessage, languageDirective };