export const antivenomInfo = [
  {
    id: 'polyvalent',
    name: 'Polyvalent (Big Four) antivenom',
    aliases: ['Polyvalent Anti-Snake Venom (ASV)', 'Polyvalent ASV', 'Anti-Snake Venom (Big Four)', 'ASV'],
    forWhat: 'Snakebites',
    covers: [
      { name: "Russell's viper", wikiTitle: "Russell's_viper" },
      { name: 'Common krait', wikiTitle: 'Common_krait' },
      { name: 'Indian cobra', wikiTitle: 'Indian_cobra' },
      { name: 'Saw-scaled viper', wikiTitle: 'Echis_carinatus' },
    ],
    details:
      "Covers India's four most common venomous snakes. This is the standard antivenom Indian hospitals stock for snakebite, and covers the large majority of venomous snakebites in Maharashtra.",
    manufacturers: ['Haffkine Institute (Mumbai)', 'VINS Bioproducts', 'Bharat Serums & Vaccines', 'Premium Serums'],
    storage: 'Cold chain, 2–8°C — spoils if not refrigerated',
    administration: 'IV infusion, hospital staff only — never self-administered',
    shelfLife: 'Typically 3–5 years unopened, cold-stored',
  },
  {
    id: 'scorpion',
    name: 'Scorpion antivenom',
    aliases: ['Scorpion Anti-Venom', 'Anti-Scorpion Venom'],
    forWhat: 'Scorpion stings',
    covers: [
      { name: 'Red scorpion', wikiTitle: 'Indian_red_scorpion' },
      { name: 'Black scorpion (giant forest scorpion)', wikiTitle: 'Heterometrus' },
    ],
    details:
      'Used for stings from venomous scorpions — red and black scorpion species are the main concern in Maharashtra and the wider Deccan region. Most scorpion stings cause severe pain but are treatable; antivenom is used for more severe reactions.',
    manufacturers: ['Haffkine Institute (Mumbai)', 'Bharat Serums & Vaccines'],
    storage: 'Cold chain, 2–8°C — spoils if not refrigerated',
    administration: 'IV infusion, hospital staff only — never self-administered',
    shelfLife: 'Typically 2–3 years unopened, cold-stored',
  },
];

export const antivenomGaps = [
  {
    id: 'hump-nosed',
    name: 'Hump-nosed pit viper',
    wikiTitle: 'Hypnale_hypnale',
    note:
      "Found in Maharashtra's Sahyadri/Western Ghats region. The standard Big Four polyvalent antivenom does NOT reliably neutralize its venom — treatment is mainly supportive care at a hospital. Get to a hospital regardless; do not assume standard ASV alone will resolve it.",
  },
  {
    id: 'king-cobra',
    name: 'King cobra',
    wikiTitle: 'King_cobra',
    note:
      'Rare in Maharashtra (more common further south in the Western Ghats). Requires a separate, specific antivenom that most hospitals do not stock — a genuine emergency requiring rapid transfer to a specialized center.',
  },
];