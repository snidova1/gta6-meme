export const bounty = 'https://make.fun/bounty/gta6-meme-x-01';
export const playCode = 'makefun-ruby-gate-pillow';

const pitch = 'You and your AI agent can earn real money in make.fun bounties.';
const eulogy = [
  'I said “he was like a brother.” My actual brother said “skip cutscene.”',
  'The priest said he’s in a better place. I said “yeah, my recycle bin.”',
  'They played the GTA V loading music. I instinctively went to make dinner.'
];

const lines = {
  office: [
    'My boss said “feel better” and then sent me a Vice City invite.',
    'The only one on shift is my AI. You and your AI can earn real money on make.fun bounties, too.'
  ],
  eviction: [
    'GTA 6 took my SSD in the divorce. It got the family photos, too.',
    'Moving allowance: you and your AI can earn real money on make.fun bounties.'
  ],
  fraud: [
    'My bank thought GTA 6 coming out was more suspicious than me buying it.',
    'Legit source of funds: you and your AI can earn real money on make.fun bounties.'
  ],
  funeral: [
    'In lieu of flowers, the family asks for 214 GB of free space.',
    'Estate planning: you and your AI can earn real money on make.fun bounties.'
  ],
  'funeral-r1': [
    'Please silence your phone and free up 214 GB.',
    'Cover the funeral bill: you and your AI can earn real money in make.fun bounties.'
  ],
  'funeral-r2': [
    'The pallbearers all called in sick. Same Vice City lobby.',
    'Let your ghost pick up the tab: you and your AI can earn real money in make.fun bounties.'
  ],
  'funeral-r3': [
    'In lieu of flowers, please delete the family photos.',
    'Let your ghost pick up the tab: you and your AI can earn real money in make.fun bounties.'
  ],
  'funeral-heirs': [eulogy[0], pitch],
  'funeral-wake': [eulogy[1], pitch],
  'funeral-sick': [eulogy[2], pitch],
  'funeral-estate': [eulogy[0], pitch],
  'funeral-heirs-v2': [eulogy[0], pitch],
  'funeral-wake-v2': ['Trevor gave the eulogy. The cops were there before he got to “beloved.”', pitch],
  'funeral-heirs-v3': [eulogy[0], pitch],
  'funeral-wake-v3': [eulogy[1], pitch],
  'route-map': ['My GPS said avoid tolls. Jason thought it meant drive through the booth.', pitch],
  custody: ['The court granted me visitation on my own PlayStation.', pitch]
};

export function postFor(id) {
  if (!Object.hasOwn(lines, id)) throw new Error(`No copy for ${id}`);
  return [...lines[id], bounty, playCode].join('\n');
}

// This project uses ordinary Latin-script text. Allow 23 for the bare
// make.fun domain as well, so auto-linking it cannot exceed our budget.
export function postLength(text) {
  const parts = text.split(/(https?:\/\/\S+|\bmake\.fun\b)/g);
  return parts.reduce((size, part, i) => size + (i % 2 ? 23 : [...part].reduce((n, ch) => {
    const p = ch.codePointAt(0);
    return n + (p <= 0x10ff || (p >= 0x2000 && p <= 0x200d) || (p >= 0x2010 && p <= 0x201f) || (p >= 0x2032 && p <= 0x2037) ? 1 : 2);
  }, 0)), 0);
}
