/**
 * Speech Synthesis & Phonetic Engine for Ismaili Center Houston
 * 
 * Strict configuration:
 * 1. Exclusively uses "Google UK English Male (en-GB)"
 * 2. Phonetic correction ensuring "Ismaili" is always pronounced with a crisp 'S'
 *    ("Iss-my-lee") and NEVER with a 'SH' ("Ishmaili")
 */

/**
 * Retrieves the Google UK English Male voice (en-GB) from the browser's speech synthesis engine.
 * Falls back gracefully to another en-GB male voice if on a non-Chromium device.
 */
export function getGoogleUKEnglishMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return null;

  // 1. Exact match for "Google UK English Male"
  const googleUKMale = voices.find(v => 
    v.name === 'Google UK English Male' ||
    (v.name.includes('Google') && v.name.includes('UK') && v.name.includes('Male'))
  );
  if (googleUKMale) return googleUKMale;

  // 2. Any Google en-GB voice
  const googleGB = voices.find(v => 
    (v.lang === 'en-GB' || v.lang === 'en_GB') && v.name.includes('Google')
  );
  if (googleGB) return googleGB;

  // 3. British English Male voice (e.g., George, Oliver, Daniel, Arthur, Ryan, or explicit male label)
  const ukMaleKeywords = ['male', 'george', 'oliver', 'daniel', 'arthur', 'ryan', 'alfie', 'brian'];
  const ukMale = voices.find(v => {
    const isGB = v.lang === 'en-GB' || v.lang === 'en_GB';
    const nameLower = v.name.toLowerCase();
    return isGB && ukMaleKeywords.some(k => nameLower.includes(k));
  });
  if (ukMale) return ukMale;

  // 4. Any en-GB / UK English voice
  const anyGB = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');
  if (anyGB) return anyGB;

  // 5. Fallback to any English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

/**
 * Phonetically pre-processes text before sending to SpeechSynthesis:
 * - Phonetically replaces "Ismaili" -> "Iss-my-lee" so speech engines never pronounce it as "Ishmaili"
 * - Phonetically replaces "Ismailis" -> "Iss-my-lees"
 * - Replaces "Ismaili's" -> "Iss-my-lee's"
 * - Formats times (10:00 AM -> 10:00 A M, Central Time)
 * - Inserts natural breathing pauses
 * - Strips all markdown, symbols, asterisks, brackets, and raw URLs
 */
export function humanizeSpokenText(text: string): string {
  if (!text) return '';

  let t = text;

  // 1. Markdown, symbols, headers & links cleanup
  t = t
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 on our official website at ismailicenter dot org')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/###?\s*/g, '')
    .replace(/^[\s]*[-*•]\s+/gm, '')
    .replace(/[-*•]\s+/g, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*#~`_\[\]]/g, '')
    .replace(/https?:\/\/[^\s]+/g, 'at ismailicenter dot org');

  // 2. CRITICAL PHONETIC FIX: Pronounce "Ismaili" strictly with crisp 'S' ("Iss-my-lee") and NEVER "Ishmaili"
  // Many TTS engines mistakenly associate "Ismail" with "Ishmael", causing an unwanted "sh" sound.
  // Using "Iss-my-lee" guarantees unvoiced /s/ and correct diphthong /maɪ/.
  t = t.replace(/\bIsmailis\b/g, 'Iss-my-lees');
  t = t.replace(/\bismailis\b/g, 'iss-my-lees');
  t = t.replace(/\bIsmaili's\b/g, "Iss-my-lee's");
  t = t.replace(/\bismaili's\b/g, "iss-my-lee's");
  t = t.replace(/\bIsmaili\b/g, 'Iss-my-lee');
  t = t.replace(/\bismaili\b/g, 'iss-my-lee');
  t = t.replace(/\bISMAILI\b/g, 'Iss-my-lee');
  t = t.replace(/\bIsmailism\b/g, 'Iss-my-lee-ism');

  // Additional Islamic architectural / center terms for natural pronunciation
  t = t.replace(/\bJamatkhana\b/g, 'Jah-maht-khana');
  t = t.replace(/\bjamatkhana\b/g, 'jah-maht-khana');
  t = t.replace(/\bAga Khan\b/g, 'Ah-ga Khan');

  // 3. Phonetic expansion for time & abbreviations
  t = t.replace(/\bCT\b/g, 'Central Time');
  t = t.replace(/\b\(CT\)/gi, 'in Central Time');
  t = t.replace(/\bCST\b/g, 'Central Standard Time');
  t = t.replace(/\bCDT\b/g, 'Central Daylight Time');

  // Phone number audio smoothing for telephone clarity
  t = t.replace(/\+?1?\s*\(?713\)?[\s.-]*522[\s.-]*2026/g, '7 1 3, 5 2 2, 2 0 2 6');

  // Time formatting: 10:00 AM -> 10:00 A M, 4:00 PM -> 4:00 P M
  t = t.replace(/(\d{1,2}):00\s*(AM|am)/g, '$1 A M');
  t = t.replace(/(\d{1,2}):00\s*(PM|pm)/g, '$1 P M');
  t = t.replace(/(\d{1,2}):(\d{2})\s*(AM|am)/g, '$1 $2 A M');
  t = t.replace(/(\d{1,2}):(\d{2})\s*(PM|pm)/g, '$1 $2 P M');

  // Time ranges: 10:00 AM – 4:00 PM -> 10:00 A M to 4:00 P M
  t = t.replace(/(\d{1,2}(?::\d{2})?\s*[AaPp]\s*[Mm])\s*[–—\-]\s*(\d{1,2}(?::\d{2})?\s*[AaPp]\s*[Mm])/g, '$1 to $2');

  // Street address smoothing
  t = t.replace(/\bBlvd\.?\b/gi, 'Boulevard');
  t = t.replace(/\bAve\.?\b/gi, 'Avenue');
  t = t.replace(/\bSt\.?\b/gi, 'Street');
  t = t.replace(/\bTx\b/gi, 'Texas');

  // Web domain
  t = t.replace(/ismailicenter\.org/gi, 'ismailicenter dot org');

  // 4. Conversational natural breathing micro-pauses
  t = t.replace(/^(Hello|Welcome|Hi there|Good morning|Good afternoon)\s+and\s+welcome/i, '$1, and welcome');
  t = t.replace(/^Hello\s+welcome/i, 'Hello, welcome');
  t = t.replace(/\bYes\s+absolutely\b/i, 'Yes, absolutely!');
  t = t.replace(/\bYes\s+indeed\b/i, 'Yes, indeed.');

  // Clean multiple newlines and spaces
  t = t.replace(/\n+/g, ' ');
  t = t.replace(/\s{2,}/g, ' ');

  return t.trim();
}
