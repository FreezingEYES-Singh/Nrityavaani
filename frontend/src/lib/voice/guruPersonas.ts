import type { Sex } from "@/components/three/figureRig";

export interface GuruPersona {
  id: string;
  name: string;
  title: string;
  sex: Sex;
  primaryLang: "hi" | "en";
  tone: string;
  badge: string;
  description: string;
  voicePitch: number;
  voiceRate: number;
  tags: string[];
}

export const GURU_PERSONAS: GuruPersona[] = [
  {
    id: "hi_meera",
    name: "Guru Meera",
    title: "Classical Abhinaya & Mudra Guru",
    sex: "female",
    primaryLang: "hi",
    tone: "Warm, Compassionate & Emotive",
    badge: "Classical Hindi",
    description: "Deep traditional expression, gentle cadence, and spiritual resonance for sacred postures.",
    voicePitch: 1.05,
    voiceRate: 0.92,
    tags: ["Hindi", "Hinglish", "Compassionate", "Devotional"],
  },
  {
    id: "en_priya",
    name: "Guru Priya",
    title: "Bharatanatyam Senior Instructress",
    sex: "female",
    primaryLang: "en",
    tone: "Articulate, Polished & Encouraging",
    badge: "Indian English",
    description: "Contemporary classical pedagogy with clear Indian English diction and anatomical precision.",
    voicePitch: 1.08,
    voiceRate: 0.95,
    tags: ["Indian English", "Pedagogy", "Encouraging", "Clear"],
  },
  {
    id: "en_arjun",
    name: "Guru Arjun",
    title: "Natyacharya & Adavu Master",
    sex: "male",
    primaryLang: "en",
    tone: "Commanding, Focused & Energetic",
    badge: "Male Natyacharya",
    description: "Vibrant rhythmic instruction, driving footwork precision and crisp geometric postures.",
    voicePitch: 0.95,
    voiceRate: 0.98,
    tags: ["Male Guru", "Tala", "Energetic", "Footwork"],
  },
  {
    id: "hi_atul",
    name: "Guru Atul",
    title: "Shastri & Natyashastra Scholar",
    sex: "male",
    primaryLang: "hi",
    tone: "Resonant, Dignified Baritone",
    badge: "Shastri / Baritone",
    description: "Deep masculine resonance commanding the stage with authentic Sanskrit and classical Hindi.",
    voicePitch: 0.88,
    voiceRate: 0.88,
    tags: ["Male Guru", "Sanskrit", "Shlokas", "Traditional"],
  },
  {
    id: "en_ananya",
    name: "Guru Ananya",
    title: "Lyrical Natya Preceptor",
    sex: "female",
    primaryLang: "en",
    tone: "Gentle, Melodic & Patient",
    badge: "Gentle Mentor",
    description: "Soft lyrical cadence helping learners cultivate grace, finger articulation, and delicate glances.",
    voicePitch: 1.12,
    voiceRate: 0.9,
    tags: ["Gentle", "Grace", "Beginner-Friendly"],
  },
  {
    id: "en_kabir",
    name: "Guru Kabir",
    title: "Laya & Mridangam Conductor",
    sex: "male",
    primaryLang: "en",
    tone: "Firm, Authoritative & Grounded",
    badge: "Laya Master",
    description: "Unwavering metronome rhythm keeping timing tight across all three speeds of adavus.",
    voicePitch: 0.92,
    voiceRate: 1.0,
    tags: ["Rhythm", "Tempo", "Discipline"],
  },
  {
    id: "hi_shivani",
    name: "Guru Shivani",
    title: "Hasya & Navarasa Specialist",
    sex: "female",
    primaryLang: "hi",
    tone: "Vibrant, Bright & Inspiring",
    badge: "Abhinaya Guide",
    description: "Bright expressiveness inspiring radiant facial abhinaya and joyful energy.",
    voicePitch: 1.1,
    voiceRate: 0.95,
    tags: ["Abhinaya", "Expressions", "Vibrant"],
  },
  {
    id: "hi_ravi",
    name: "Guru Ravi",
    title: "Tandava & Form Coach",
    sex: "male",
    primaryLang: "hi",
    tone: "Dynamic, Motivating & Bold",
    badge: "Dynamic Hindi",
    description: "Dynamic masculine power pushing dancers through rigorous stamina and Aramandi stability.",
    voicePitch: 0.96,
    voiceRate: 0.96,
    tags: ["Tandava", "Stamina", "Form"],
  },
  {
    id: "en_divya",
    name: "Guru Divya",
    title: "Body Alignment & Posture Lead",
    sex: "female",
    primaryLang: "en",
    tone: "Meticulous & Poised",
    badge: "Posture Precision",
    description: "Ergonomic clarity breaking down knee turnout, spinal elongation, and pelvic balance.",
    voicePitch: 1.02,
    voiceRate: 0.94,
    tags: ["Ergonomics", "Alignment", "Precision"],
  },
  {
    id: "en_dev",
    name: "Guru Dev",
    title: "Meditative Movement Guide",
    sex: "male",
    primaryLang: "en",
    tone: "Calm, Centered & Measured",
    badge: "Steady Guide",
    description: "Quiet focus and breath awareness anchoring every entry and conclusion of the dance.",
    voicePitch: 0.9,
    voiceRate: 0.9,
    tags: ["Meditative", "Prana", "Balance"],
  },
  {
    id: "en_nisha",
    name: "Guru Nisha",
    title: "Global Academy Director",
    sex: "female",
    primaryLang: "en",
    tone: "Crisp, Clear & Contemporary",
    badge: "Modern English",
    description: "Bilingual clarity bridging ancient Natyashastra concepts with contemporary pedagogy.",
    voicePitch: 1.04,
    voiceRate: 0.98,
    tags: ["International", "Clarity", "Structured"],
  },
  {
    id: "en_sameer",
    name: "Guru Sameer",
    title: "Foundations Mentor",
    sex: "male",
    primaryLang: "en",
    tone: "Warm, Friendly & Accessible",
    badge: "Beginner Friendly",
    description: "Approachable guidance dispelling beginner fears and instilling immediate confidence.",
    voicePitch: 0.98,
    voiceRate: 0.95,
    tags: ["Beginners", "Warm", "Encouraging"],
  },
  {
    id: "en_tara",
    name: "Guru Tara",
    title: "Youth & Soloist Mentor",
    sex: "female",
    primaryLang: "en",
    tone: "Radiant, Cheerful & Uplifting",
    badge: "Youthful Guide",
    description: "Playful vitality making adavu practice uplifting and delightfully engaging.",
    voicePitch: 1.15,
    voiceRate: 0.96,
    tags: ["Joyful", "Uplifting", "Vibrant"],
  },
  {
    id: "en_aman",
    name: "Guru Aman",
    title: "Step-by-Step Drill Master",
    sex: "male",
    primaryLang: "en",
    tone: "Methodical & Patient",
    badge: "Step-by-Step",
    description: "Exacting breakdown of complex hand and foot coordination into simple building blocks.",
    voicePitch: 0.94,
    voiceRate: 0.92,
    tags: ["Methodical", "Drills", "Coordination"],
  },
  {
    id: "bed_hindi",
    name: "Guru Parampara",
    title: "Traditional Archival Bed",
    sex: "female",
    primaryLang: "hi",
    tone: "Classic Sanskrit & Temple Tone",
    badge: "Archival Bed",
    description: "The foundational archival acoustic reference voice trained directly on classic temple chants.",
    voicePitch: 1.0,
    voiceRate: 0.9,
    tags: ["Archival", "Authentic", "Parampara"],
  },
];

import type { Language } from "@/lib/lesson/manifest";

export function getPersona(id: string): GuruPersona {
  return GURU_PERSONAS.find((p) => p.id === id) || GURU_PERSONAS[0];
}

export function getDefaultPersonaForSex(sex: Sex): GuruPersona {
  return sex === "female"
    ? GURU_PERSONAS[0] // Guru Meera
    : GURU_PERSONAS[2]; // Guru Arjun
}

/**
 * Automatically selects the highest quality Goonj persona voicepack
 * best calibrated to deliver the selected language and figure gender.
 */
export function getBestPersonaForLanguage(lang: Language, sex: Sex = "female"): GuruPersona {
  if (sex === "male") {
    switch (lang) {
      case "en":
        return getPersona("en_arjun"); // Guru Arjun - Dynamic Natyacharya
      case "hi":
      case "hing":
      case "sa":
        return getPersona("hi_atul");  // Guru Atul - Dignified Shastri baritone
      default:
        return getPersona("en_arjun"); // Regional male delivery
    }
  }

  // female mentors
  switch (lang) {
    case "en":
      return getPersona("en_priya"); // Guru Priya - Polished Indian English
    case "hi":
    case "hing":
      return getPersona("hi_meera"); // Guru Meera - Classical Hindi
    case "sa":
      return getPersona("bed_hindi"); // Guru Parampara - Sacred classical shlokas
    default:
      return getPersona("hi_meera"); // Regional female delivery (Tamil, Telugu, etc.)
  }
}

export interface GuruVoiceModelOption {
  id: string;
  name: string;
  title: string;
  sex: Sex;
  badge: string;
  tone: string;
  bestFor: string;
  description: string;
}

export function getVoiceModelsForLanguage(lang: Language): GuruVoiceModelOption[] {
  switch (lang) {
    case "en":
      return [
        {
          id: "en_priya",
          name: "Guru Priya",
          title: "Bharatanatyam Senior Instructress",
          sex: "female",
          badge: "Indian English",
          tone: "Articulate, Polished & Encouraging",
          bestFor: "Clear diction, contemporary pedagogy & anatomical precision",
          description: "Clear articulation breaking down mudras, stance, and classical terminology in polished Indian English.",
        },
        {
          id: "en_arjun",
          name: "Guru Arjun",
          title: "Natyacharya & Adavu Master",
          sex: "male",
          badge: "Male Natyacharya",
          tone: "Commanding, Focused & Energetic",
          bestFor: "Adavu footwork, energetic rhythm & driving tala",
          description: "Vibrant rhythmic instruction commanding crisp footwork, sharp angles, and energetic pacing.",
        },
        {
          id: "en_ananya",
          name: "Guru Ananya",
          title: "Lyrical Natya Preceptor",
          sex: "female",
          badge: "Gentle Mentor",
          tone: "Gentle, Melodic & Patient",
          bestFor: "Delicate mudras, abhinaya nuances & beginners",
          description: "Patient, soothing cadence helping learners cultivate grace, soft finger articulation, and delicate glances.",
        },
        {
          id: "en_kabir",
          name: "Guru Kabir",
          title: "Laya & Mridangam Conductor",
          sex: "male",
          badge: "Laya Master",
          tone: "Firm, Authoritative & Grounded",
          bestFor: "Strict rhythm, laya, tempo drills & stamina",
          description: "Unwavering metronome rhythm keeping timing tight across all speeds of adavus.",
        },
        {
          id: "en_divya",
          name: "Guru Divya",
          title: "Body Alignment & Posture Lead",
          sex: "female",
          badge: "Posture Precision",
          tone: "Meticulous & Poised",
          bestFor: "Ergonomics, knee turnout, spinal elongation & balance",
          description: "Ergonomic clarity breaking down knee turnout, spinal alignment, and pelvic balance.",
        },
        {
          id: "en_dev",
          name: "Guru Dev",
          title: "Meditative Movement Guide",
          sex: "male",
          badge: "Steady Guide",
          tone: "Calm, Centered & Measured",
          bestFor: "Meditative flow, breath awareness & slow practice",
          description: "Quiet focus and breath awareness anchoring slow-speed foundation and spiritual connection.",
        },
        {
          id: "en_nisha",
          name: "Guru Nisha",
          title: "Global Academy Director",
          sex: "female",
          badge: "Modern English",
          tone: "Crisp, Clear & Contemporary",
          bestFor: "International learners & contemporary global clarity",
          description: "Bilingual clarity bridging ancient Natyashastra concepts with contemporary pedagogy.",
        },
        {
          id: "en_sameer",
          name: "Guru Sameer",
          title: "Foundations Mentor",
          sex: "male",
          badge: "Beginner Friendly",
          tone: "Warm, Friendly & Accessible",
          bestFor: "Easing beginner tension & building immediate confidence",
          description: "Approachable guidance dispelling beginner fears and instilling immediate confidence.",
        },
        {
          id: "en_tara",
          name: "Guru Tara",
          title: "Youth & Soloist Mentor",
          sex: "female",
          badge: "Youthful Guide",
          tone: "Radiant, Cheerful & Uplifting",
          bestFor: "Joyful vitality, uplifting energy & soloist presentation",
          description: "Playful vitality making adavu practice uplifting and delightfully engaging.",
        },
        {
          id: "en_aman",
          name: "Guru Aman",
          title: "Step-by-Step Drill Master",
          sex: "male",
          badge: "Step-by-Step",
          tone: "Methodical & Patient",
          bestFor: "Hand-foot coordination drills & breaking complex bols",
          description: "Exacting breakdown of complex hand and foot coordination into simple building blocks.",
        },
      ];

    case "hi":
    case "hing":
      return [
        {
          id: "hi_meera",
          name: "Guru Meera",
          title: "Classical Abhinaya & Mudra Guru",
          sex: "female",
          badge: "Classical Hindi",
          tone: "Warm, Compassionate & Emotive",
          bestFor: "Traditional abhinaya, mudra nuance & devotional expression",
          description: "Deep traditional expression, gentle cadence, and spiritual resonance for sacred postures.",
        },
        {
          id: "hi_atul",
          name: "Guru Atul",
          title: "Shastri & Natyashastra Scholar",
          sex: "male",
          badge: "Shastri / Baritone",
          tone: "Resonant, Dignified Baritone",
          bestFor: "Natyashastra shlokas, sacred chants & dignified recitation",
          description: "Deep masculine resonance commanding the stage with authentic Sanskrit and classical Hindi.",
        },
        {
          id: "hi_shivani",
          name: "Guru Shivani",
          title: "Hasya & Navarasa Specialist",
          sex: "female",
          badge: "Abhinaya Guide",
          tone: "Vibrant, Bright & Inspiring",
          bestFor: "Bright facial abhinaya, eye glances & navarasa expression",
          description: "Bright expressiveness inspiring radiant facial abhinaya and joyful energy.",
        },
        {
          id: "hi_ravi",
          name: "Guru Ravi",
          title: "Tandava & Form Coach",
          sex: "male",
          badge: "Dynamic Hindi",
          tone: "Dynamic, Motivating & Bold",
          bestFor: "Tandava power, vigorous adavu drills & stamina",
          description: "Dynamic masculine power pushing dancers through rigorous stamina and Aramandi stability.",
        },
        {
          id: "bed_hindi",
          name: "Guru Parampara",
          title: "Traditional Archival Bed",
          sex: "female",
          badge: "Archival Bed",
          tone: "Classic Sanskrit & Temple Tone",
          bestFor: "Sacred temple chants, Vedic shlokas & ritual namaskaram",
          description: "The foundational archival acoustic reference voice trained directly on classic temple chants.",
        },
      ];

    case "sa":
      return [
        {
          id: "bed_hindi",
          name: "Guru Parampara",
          title: "Vedic Chanting Preceptor",
          sex: "female",
          badge: "Vedic Sanskrit",
          tone: "Sacred Vedic Tone & Clear Chants",
          bestFor: "Pure Natyashastra shlokas, invocations & mantras",
          description: "Original Sanskrit pronunciation with authentic Vedic intonation and spiritual depth.",
        },
        {
          id: "hi_atul",
          name: "Guru Atul",
          title: "Shastri & Sanskrit Scholar",
          sex: "male",
          badge: "Shastri Baritone",
          tone: "Resonant, Dignified Baritone",
          bestFor: "Dignified Sanskrit recitation, vandana & masculine shlokas",
          description: "Resonant baritone delivery commanding reverence for Natyashastra treatises.",
        },
        {
          id: "hi_meera",
          name: "Guru Meera",
          title: "Bhakti & Shloka Guide",
          sex: "female",
          badge: "Devotional Sanskrit",
          tone: "Melodic & Devotional",
          bestFor: "Shloka abhinaya, stutis & devotional rasa",
          description: "Gentle devotional recitation paired with abhinaya instructions.",
        },
      ];

    case "ta":
      return [
        {
          id: "hi_meera",
          name: "Guru Pallavi",
          title: "Bharatanatyam Senior Instructress",
          sex: "female",
          badge: "Classical Tamil",
          tone: "Articulate & Graceful",
          bestFor: "Bharatanatyam Tamil instruction & mudra abhinaya",
          description: "Authentic Tamil classical pronunciation with precise adavu corrections and lyrical grace.",
        },
        {
          id: "en_arjun",
          name: "Guru Valluvar",
          title: "Tamil Natyacharya & Nattuvanar",
          sex: "male",
          badge: "Tamil Natyacharya",
          tone: "Commanding, Focused & Rhythmic",
          bestFor: "Rhythmic sollukattu, vigorous adavus & tala",
          description: "Powerful sollukattu recitations and masculine rhythm anchoring rigorous footwork.",
        },
      ];

    case "te":
      return [
        {
          id: "hi_meera",
          name: "Guru Shruti",
          title: "Kuchipudi & Natya Instructress",
          sex: "female",
          badge: "Classical Telugu",
          tone: "Melodic & Poised",
          bestFor: "Kuchipudi & Bharatanatyam Telugu instruction",
          description: "Rich classical Telugu phonetics guiding footwork, eye movements, and hand postures.",
        },
        {
          id: "en_arjun",
          name: "Guru Mohan",
          title: "Telugu Natyacharya",
          sex: "male",
          badge: "Telugu Natyacharya",
          tone: "Energetic & Rhythmic",
          bestFor: "Jathis, dynamic footwork & rhythmic speed",
          description: "Commanding Telugu rhythmic guidance and precise adavu execution.",
        },
      ];

    case "ml":
      return [
        {
          id: "hi_meera",
          name: "Guru Sobhana",
          title: "Mohiniyattam & Lasya Acharya",
          sex: "female",
          badge: "Classical Malayalam",
          tone: "Lyrical & Gentle",
          bestFor: "Mohiniyattam nuances, lasya grace & mudras",
          description: "Melodic Malayalam guidance focusing on delicate swaying (andolika) and mudras.",
        },
        {
          id: "en_arjun",
          name: "Guru Midhun",
          title: "Kathakali & Natya Master",
          sex: "male",
          badge: "Kathakali Acharya",
          tone: "Grounded, Strong & Resonant",
          bestFor: "Grounded postures, tandem footwork & tandava",
          description: "Robust Malayalam delivery commanding strong stances, mudras, and eye movements.",
        },
      ];

    default:
      return [
        {
          id: "hi_meera",
          name: "Guru Devi",
          title: "Classical Regional Preceptor",
          sex: "female",
          badge: "Regional Classical",
          tone: "Warm, Clear & Articulate",
          bestFor: "Regional classical instruction & delicate mudras",
          description: "Clear regional phonetics guiding adavus and abhinaya with grace.",
        },
        {
          id: "en_arjun",
          name: "Guru Natyacharya",
          title: "Regional Rhythm Master",
          sex: "male",
          badge: "Regional Natyacharya",
          tone: "Commanding & Rhythmic",
          bestFor: "Rhythmic footwork, tala & adavu drills",
          description: "Rhythmic regional guidance keeping precision timing and adavu drills crisp.",
        },
      ];
  }
}
