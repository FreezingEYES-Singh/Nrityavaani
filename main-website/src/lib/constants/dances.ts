/**
 * The seven classical dances of India.
 *
 * This is the site's front door now: NrityaVaani is a place to learn the
 * classical forms, not just the Bharatanatyam hasta vocabulary. Each entry
 * carries a photograph, the state it comes from, a one-line essence for the
 * cards, three quick facts for its description on `/learn`, and five short
 * `sections` — Origin / Technique / Music / Costume / Signature — that fill the
 * back of the hero's flipping card and the side of the dance's own page.
 *
 * The photographs are the lead images of the corresponding Wikipedia articles,
 * fetched from Wikimedia Commons and stored under `public/images/dances/`.
 * Every one is freely licensed and credited in the `attribution` field, which
 * will be rendered in a dedicated credits section. Do not drop the credit.
 */

export type DanceAttribution = {
  author: string;
  license: string;
  licenseUrl: string;
  page: string;
};

export type DanceSection = {
  title: string;
  body: string;
};

export type Dance = {
  slug: string;
  name: string;
  region: string;
  /** The italic line that sits under the name on a card. */
  essence: string;
  /** One or two sentences for the featured card, `/learn`, and the dance's page. */
  description: string;
  /** Three short facts, for the dance's description on `/learn`. */
  facts: string[];
  /** The five short sections on the back of the hero card and beside the dance's parts. */
  sections: DanceSection[];
  image: string;
  attribution: DanceAttribution;
};

export const DANCES: Dance[] = [
  {
    slug: "bharatanatyam",
    name: "Bharatanatyam",
    region: "Tamil Nadu",
    essence: "The temple dance of Tamil Nadu",
    description:
      "The oldest classical tradition, sculpted into temple walls and codified in the Natya Shastra — a fixed torso, bent knees, and a precise language of hand, eye and face.",
    facts: [
      "The oldest classical tradition, rooted in temple dance",
      "Built on aramandi — the bent-knee half-sit",
      "Hasta mudras are its sign language",
    ],
    sections: [
      {
        title: "Origin",
        body: "The temple dance of Tamil Nadu, sculpted on Chola temple walls and codified in the Natya Shastra.",
      },
      {
        title: "Technique",
        body: "A fixed torso, the bent-knee aramandi, and hasta mudras carrying the meaning.",
      },
      {
        title: "Music",
        body: "Carnatic ragas and talas; the nattuvanar calls the rhythm on cymbals.",
      },
      {
        title: "Costume",
        body: "A silk sari pleated like a fan, temple jewellery, and red alta on the feet.",
      },
      {
        title: "Signature",
        body: "The aramandi half-sit and the precise geometry of the hasta mudras.",
      },
    ],
    image: "/images/dances/bharatanatyam.jpg",
    attribution: {
      author: "Vivekh 1979",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      page: "https://commons.wikimedia.org/wiki/File:Murugashankari_Leo.jpg",
    },
  },
  {
    slug: "kathak",
    name: "Kathak",
    region: "Uttar Pradesh",
    essence: "The storytellers' dance of the north",
    description:
      "Born of wandering kathakaars and shaped by the Mughal courts, Kathak turns rhythm into spectacle — spins, ghungroo-laced footwork, and storytelling through abhinaya.",
    facts: [
      "The only classical form shaped by the Mughal courts",
      "Ghungroo bells count every beat of the footwork",
      "Built on spins, rhythm and storytelling",
    ],
    sections: [
      {
        title: "Origin",
        body: "Born of wandering kathakaars, then shaped into court art under the Mughals.",
      },
      {
        title: "Technique",
        body: "Blazing spins, ghungroo-laced footwork, and storytelling through abhinaya.",
      },
      {
        title: "Music",
        body: "Hindustani ragas and talas; the dancer recites the bols before dancing them.",
      },
      {
        title: "Costume",
        body: "A flowing angarkha or anarkali with a veil, and a hundred ghungroos.",
      },
      {
        title: "Signature",
        body: "The chakkar — a spinning turn that lands exactly on the beat.",
      },
    ],
    image: "/images/dances/kathak.jpg",
    attribution: {
      author: "Shinjinikulkarni",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      page: "https://commons.wikimedia.org/wiki/File:Kathak_contemporary_03.jpg",
    },
  },
  {
    slug: "kathakali",
    name: "Kathakali",
    region: "Kerala",
    essence: "Kerala's painted dance-drama",
    description:
      "A night-long epic enacted in elaborate make-up and costume, where the face and eyes carry the story and the percussion carries the night.",
    facts: [
      "A night-long dance-drama from Kerala",
      "Face paint is a code — colour tells the character",
      "Speaks with the eyes more than with words",
    ],
    sections: [
      {
        title: "Origin",
        body: "A night-long dance-drama of Kerala's temples, retelling the epics.",
      },
      {
        title: "Technique",
        body: "The face and eyes speak; mudras and percussion carry the story.",
      },
      {
        title: "Music",
        body: "Chenda and maddalam drums, singers, and the ilathalam cymbal.",
      },
      {
        title: "Costume",
        body: "Elaborate face paint — green for the noble, red for the fierce.",
      },
      {
        title: "Signature",
        body: "The eye-and-brow kalasams, drawn out over a single night.",
      },
    ],
    image: "/images/dances/kathakali.jpg",
    attribution: {
      author: "Bhoomi at Malayalam Wikipedia",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      page: "https://commons.wikimedia.org/wiki/File:Kathakali_-Play_with_Kaurava.jpg",
    },
  },
  {
    slug: "kuchipudi",
    name: "Kuchipudi",
    region: "Andhra Pradesh",
    essence: "Quick-footed dance-drama of Andhra",
    description:
      "A dance-drama named for the village it began in, famed for its speed, its percussion, and the dancer balanced on the rim of a brass plate.",
    facts: [
      "Named after a village in Andhra Pradesh",
      "Famous for dancing on the rim of a brass plate",
      "Rooted in Vaishnavite devotion",
    ],
    sections: [
      {
        title: "Origin",
        body: "Named for the village of Kuchipudi, where it began as Vaishnavite theatre.",
      },
      {
        title: "Technique",
        body: "Quick footwork, sharp geometry, and a dancer balanced on a brass plate.",
      },
      {
        title: "Music",
        body: "Carnatic ragas and talas, driven by mridangam and violin.",
      },
      {
        title: "Costume",
        body: "A silk sari with a fan pleat at the back and temple jewellery.",
      },
      {
        title: "Signature",
        body: "Tarangam — dancing on the rim of a brass plate with a pot on the head.",
      },
    ],
    image: "/images/dances/kuchipudi.jpg",
    attribution: {
      author: "Augustus Binu",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      page: "https://commons.wikimedia.org/wiki/File:Kuchipudi_Performer_DS.jpg",
    },
  },
  {
    slug: "odissi",
    name: "Odissi",
    region: "Odisha",
    essence: "The temple dance of the tribhangi",
    description:
      "Odisha's temple dance, built on the tribhangi — the three bends of head, torso and hip — with poses that look lifted straight off a temple wall.",
    facts: [
      "Built on tribhangi — the three bends of the body",
      "Poses mirror the carvings on temple walls",
      "Danced to Odissi ragas and talas",
    ],
    sections: [
      {
        title: "Origin",
        body: "Odisha's temple dance, once danced by the maharis of Jagannath.",
      },
      {
        title: "Technique",
        body: "Tribhangi — the three bends of head, torso and hip; poses off temple walls.",
      },
      {
        title: "Music",
        body: "Odissi ragas and talas, with pakhawaj and flute.",
      },
      {
        title: "Costume",
        body: "Silver filigree jewellery and a sari wrapped in the traditional style.",
      },
      {
        title: "Signature",
        body: "The tribhangi S-curve, frozen like a sculpture.",
      },
    ],
    image: "/images/dances/odissi.jpg",
    attribution: {
      author: "Shagil Kannur",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      page: "https://commons.wikimedia.org/wiki/File:Odissi_dance_at_Nishagandi_Dance_Festival_2024_(207).jpg",
    },
  },
  {
    slug: "manipuri",
    name: "Manipuri",
    region: "Manipur",
    essence: "The lyrical Raas Leela of Manipur",
    description:
      "A gentle, devotional telling of Radha and Krishna, with rounded movement and no hard edges — at once the oldest and youngest of the classical forms.",
    facts: [
      "Enacts the Raas Leela of Radha and Krishna",
      "Rounded, flowing — no sharp angles anywhere",
      "Soft devotion is its only expression",
    ],
    sections: [
      {
        title: "Origin",
        body: "A devotional retelling of Radha and Krishna's Raas Leela.",
      },
      {
        title: "Technique",
        body: "Rounded, flowing movement with no sharp angles — soft and lyrical.",
      },
      {
        title: "Music",
        body: "The pung drum and flute carry the kirtan rhythm.",
      },
      {
        title: "Costume",
        body: "The stiff, cylindrical potloi skirt with a translucent veil.",
      },
      {
        title: "Signature",
        body: "The potloi skirt, gliding like a bell over the stage.",
      },
    ],
    image: "/images/dances/manipuri.jpg",
    attribution: {
      author: "Sudip Kumar Ghosh",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      page: "https://commons.wikimedia.org/wiki/File:Classical_manipuri_dance.jpg",
    },
  },
  {
    slug: "mohiniyattam",
    name: "Mohiniyattam",
    region: "Kerala",
    essence: "The swaying dance of the enchantress",
    description:
      "Kerala's lasya form, a solo of soft, swaying movement in white and gold, named for Mohini, the enchantress avatar of Vishnu.",
    facts: [
      "Named for Mohini, Vishnu's enchantress avatar",
      "A solo lasya form, always in white and gold",
      "Soft, swaying — the dance of enchantment",
    ],
    sections: [
      {
        title: "Origin",
        body: "Named for Mohini, Vishnu's enchantress avatar; a solo lasya form.",
      },
      {
        title: "Technique",
        body: "Soft, swaying movement with a gentle side-to-side glide.",
      },
      {
        title: "Music",
        body: "Sopana and Carnatic ragas, set to slow, lilting talas.",
      },
      {
        title: "Costume",
        body: "A white sari with a gold border, gold jewellery, jasmine in the hair.",
      },
      {
        title: "Signature",
        body: "The ati bhanga sway — the whole body rippling like a river.",
      },
    ],
    image: "/images/dances/mohiniyattam.jpg",
    attribution: {
      author: "Shagil Kannur",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      page: "https://commons.wikimedia.org/wiki/File:A_Mohiniyattam_Artist_form_Kerala_(HSS)_(392).jpg",
    },
  },
];
