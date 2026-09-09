export const FEEDBACK_TRANSLATIONS: Record<string, string> = {
  // Common / General
  "Show your hand to the camera to begin.": "Pranaam! Chaliye abhyas shuru karte hain. Apna hath camera ke samne laiye.",
  "Adjust your hand position or check the lighting.": "Kripya apne hath ki sthiti (position) badaliye, taaki main sahi se dekh sakun.",
  "Adjust your hand position to match the reference image.": "Apne hath ko pradarshit chitra (reference image) ke anusar sthapit kijiye.",
  "Awaiting Match": "Mudra ka milan kar rahi hoon...",
  "Excellent Form": "Adbhut! Bilkul sahi mudra.",
  "Keep Adjusting": "Prayas karte rahiye, thoda aur sudhaar ki aavashyakta hai.",
  "None": "Koi mudra nahi dikh rahi",
  "Perfect": "Sampoorna (Perfect)",
  "Good attempt. Keep holding the": "Uttam prayas! Isi tarah mudra ko banaye rakhein",

  // Specific Actions
  "Straighten your Index finger.": "Kripya apni Tarjani (Index finger) ko seedha kijiye.",
  "Straighten your Middle finger.": "Madhyama (Middle finger) ko bilkul seedha rakhein.",
  "Straighten your Ring finger.": "Anamika (Ring finger) ko seedha karne ka prayas kijiye.",
  "Straighten your Pinky finger.": "Kanishthika (Pinky finger) ko seedha kijiye.",
  "Straighten all fingers.": "Apni sabhi unglio ko vistar dein aur seedha rakhein.",
  "Bend your Index finger.": "Tarjani (Index finger) ko thoda modiye.",
  "Bend your Middle finger.": "Madhyama (Middle finger) ko modiye.",
  "Bend your Ring finger.": "Anamika (Ring finger) ko modiye.",
  "Bend your Pinky finger.": "Kanishthika (Pinky finger) ko modiye.",
  "Bend your Index finger into a hook.": "Tarjani ko ankush (hook) ki tarah modiye.",
  "Bend your Ring finger more.": "Anamika ko aur adhik modne ka prayas karein.",
  "Bend your Ring finger fully.": "Anamika (Ring finger) ko poori tarah modiye.",
  "Bend your Pinky finger fully.": "Kanishthika (Pinky) ko poori tarah modiye.",
  "Bring all fingers closer together.": "Sabh unglio ko ek dusre ke sameep laiye.",
  "Bring your fingers closer together.": "Unglio ko aapas mein jod kar rakhein.",
  "Keep Index finger straight.": "Tarjani ko seedha rakhna anivarya hai.",
  "Keep Middle finger straight.": "Madhyama ko seedha rakhein.",
  "Keep Pinky finger straight.": "Kanishthika ko seedha rakhein.",
  "Keep all fingers straight": "Sabhi unglio ko seedha aur tann kar rakhein.",
  "Middle finger should be vertical.": "Madhyama finger seedhi upar ki or honi chahiye.",
  "Ring finger should be vertical.": "Anamika finger seedhi upar ki or honi chahiye.",
  "Pinky finger should be vertical.": "Kanishthika finger seedhi upar ki or honi chahiye.",
  "Spread Index and Middle fingers wider.": "Tarjani aur Madhyama ke beech thoda aur sthaan banaiye.",
  "Spread all fingers outward.": "Sabhi unglio ko bahar ki or failaiye.",
  "Touch Thumb tip to Ring finger tip.": "Angoothe aur Anamika ke upari hisse ko sparsh kijiye.",
  "Touch your thumb to your ring finger.": "Angoothe ko Anamika se sparsh kijiye.",
  "Curve your Index finger back.": "Tarjani ko piche ki or halka sa modiye.",
  "Curve your Middle finger back.": "Madhyama ko piche ki or modiye.",
  "Index finger should be hooked.": "Tarjani ankush (hook) ki mudra mein honi chahiye.",
  "Ring finger should be hooked.": "Anamika ankush ki mudra mein honi chahiye.",
  "Middle finger must be straight.": "Madhyama ko bilkul seedha rakhein.",
  "Pinky must be straight.": "Kanishthika seedhi honi chahiye.",
  "Index finger must be straight.": "Tarjani ko seedha rakhein.",
  // Mudra specific
  "Excellent Pataka form.": "Pataka mudra ka uttam pradarshan.",
  "Good Tripataka form.": "Tripataka mudra bahut sundar hai.",
  "Great Ardhapataka.": "Uttam Ardhapataka mudra.",
  "Perfect Kartarimukha v-shape.": "Kartarimukha ka V-shape bilkul sahi hai.",
  "Beautiful Peacock pose.": "Mayura mudra bilkul mayur ki tarah sundar hai.",
  "Arala mudra detected.": "Arala mudra ka abhyas prarambh hai.",
  "Excellent Shukatunda.": "Shukatunda mudra bahut prabhavshali hai.",
  "Beautiful Alapadma lotus.": "Alapadma mudra khile huye kamal ki tarah hai.",
  // Misc
  "Keep practicing the form.": "Niyamat abhyas hi aapko nipun banayega.",
};

export const MUDRA_NAME_TRANSLATIONS: Record<string, string> = {
  "Pataka": "Pataka",
  "Tripataka": "Tripataka",
  "Ardhapataka": "Ardhapataka",
  "Kartarimukha": "Kartarimukha",
  "Mayura": "Mayura",
  "Arala": "Arala",
  "Shukatunda": "Shukatunda",
  "Alapadma": "Alapadma",
};

export function translateFeedback(text: string, lang: 'en' | 'hi'): string {
  if (lang === 'en') return text;
  
  // Try to find direct match
  if (FEEDBACK_TRANSLATIONS[text]) return FEEDBACK_TRANSLATIONS[text];
  
  // Mudra names are left as they are: they are Sanskrit, and transliterating
  // them into Devanagari would not make them more readable to a student who
  // already knows them by these names.

  if (text.includes("Detected") && text.includes("instead")) {
    const parts = text.split(" ");
    const detected = parts[1];
    const target = parts[parts.length - 1].replace(".", "");
    return `Mujhe ${detected} dikh rahi hai, lekin hum ${target} ki practice kar rahe hain.`;
  }

  if (text.includes("Perfect") && text.includes("detected")) {
    const name = text.split(" ")[1];
    return `Bahut badhiya! Sahi ${name} mudra sahi hai.`;
  }

  return text;
}
