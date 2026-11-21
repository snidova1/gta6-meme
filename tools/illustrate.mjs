const ink = '#21171f';
const magenta = '#c21883';
const white = '#fffdfc';
const mono = 'Consolas, monospace';
const serif = 'Georgia, serif';

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const text = (s, x, y, o = {}) => `<text x="${x}" y="${y}" font-size="${o.size ?? 16}" font-weight="${o.weight ?? 700}" fill="${o.color ?? ink}" text-anchor="${o.align ?? 'start'}" letter-spacing="${o.track ?? 0}"${o.font ? ` font-family="${o.font}"` : ''}${o.italic ? ' font-style="italic"' : ''}${o.fit ? ` textLength="${o.fit}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(s)}</text>`;
const box = (x, y, w, h, fill, r = 0, stroke = 'none', sw = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (x, y, r, fill, stroke = 'none', sw = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const path = (d, fill = 'none', stroke = 'none', w = 1) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const place = (x, y, s, content) => `<g transform="translate(${x} ${y}) scale(${s})">${content}</g>`;
const rotate = (a, x, y, content) => `<g transform="rotate(${a} ${x} ${y})">${content}</g>`;
const strike = (x, y, w, color = '#ab315b') => path(`M${x} ${y}h${w}`, 'none', color, 1.6);
const label = (s, x, y, color, size = 14) => text(s, x, y, { font: mono, color, size, track: .25 });
const dot = (x, y, c) => circle(x, y, 3.2, c);
const shadow = (x, y, w, h, fill, r = 0, stroke = ink, sw = 2) => box(x + 4, y + 5, w, h, stroke, r) + box(x, y, w, h, fill, r, stroke, sw);

function spark(x, y, r, fill) {
  return place(x, y, r / 10, path('M0-10Q2-2 10 0Q2 2 0 10Q-2 2-10 0Q-2-2 0-10Z', fill));
}

function coin(x, y, r) {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = k * Math.PI / 5 - 1.72;
    const l = k % 2 ? .28 : .59;
    return `${(Math.cos(a) * r * l).toFixed(2)},${(Math.sin(a) * r * l).toFixed(2)}`;
  }).join(' ');
  return `<g transform="translate(${x} ${y})">${circle(2, 2, r, '#780849', ink, 4)}${circle(0, 0, r, magenta, ink, 4)}${circle(0, 0, r - 4, 'none', '#f559b7', 1)}<polygon points="${pts}" fill="${white}" stroke="${white}" stroke-width="1" stroke-linejoin="round"/></g>`;
}

function ghost(x, y, scale, pose) {
  const headset = path('M22 47V39C22 3 84 1 93 39M25 62q1 14 20 14', 'none', ink, 4.3) + box(18, 39, 15, 26, '#6a60f0', 5, ink, 3) + box(42, 72, 10, 7, ink, 3);
  const bow = path('M47 79L33 72V91L48 85L63 91V72L49 79Z', '#ad286f', ink, 3) + circle(48, 82, 4, '#ffb2de', ink, 2);
  const badge = rotate(-8, 47, 83, box(31, 77, 34, 14, '#048b68', 4, ink, 2) + path('M39 84l3 3 5-6m5 2h5', 'none', white, 1.8));
  const handX = pose === 'phone' ? 96 : 97;
  const handY = pose === 'phone' ? 74 : 64;
  return place(x, y, scale, [
    path('M28 85Q5 91 7 75Q9 65 17 57L20 40C23 14 40 5 58 6Q88 5 98 29Q103 40 101 63L107 86Q110 109 88 113Q72 117 60 104Q49 116 36 111Q22 107 26 90Z', white, ink, 5),
    path('M26 90q19 8 34 5q25 9 44-3q-1 16-18 18q-16 3-26-6q-11 12-24 7q-12-4-10-21Z', '#eee5f0'),
    path('M28 86q-1-7 3-11M60 104l1-8', 'none', ink, 4),
    spark(45, 53, 12, ink), spark(74, 44, 12.2, ink),
    pose === 'phone' ? headset : pose === 'undertaker' ? bow : pose === 'teller' ? badge : '',
    coin(116, pose === 'teller' ? 51 : 47, 22),
    circle(handX, handY, 10.8, white, ink, 4)
  ].join(''));
}

const laptop = (x, y, s) => place(x, y, s, path('M14 0h59l10 39H0L9 6Q10 0 14 0Z', '#82ffd6', ink, 4) + path('M0 39h90l-4 8H4Z', '#8b83fb', ink, 4) + spark(43, 19, 8, ink));

function photo(x, y) {
  return rotate(-8, x + 25, y + 22, box(x, y, 48, 42, '#fff7dd', 2, ink, 2.5) + box(x + 4, y + 4, 40, 28, '#bcded7', 1) + circle(x + 34, y + 11, 4, '#f8945d') + path(`M${x + 4} ${y + 32}l12-12 9 8 7-5 12 9Z`, '#3d8a73'));
}

function gator(x, y, s) {
  return place(x, y, s, path('M10 26Q2 18 12 13L45 10Q49 0 59 2Q67 2 71 13L78 38Q64 53 45 38L16 35Z', '#62bc71', ink, 3) + path('M10 26q20 7 46 3m-28 2 3 5 5-4m6 0 4 5 5-6', white, ink, 2) + circle(55, 11, 3.3, ink) + circle(17, 18, 1.7, ink));
}

function dates(x, y, color, finalColor, amount = '19 NOV 2026') {
  return label('FALL ’25', x, y, color) + strike(x - 1, y - 5, 70) + label('MAY ’26', x + 79, y, color) + strike(x + 78, y - 5, 62) + label(amount, x + 151, y, finalColor);
}

function office() {
  const night = '#172039';
  const violet = '#564adc';
  return box(0, 0, 480, 480, '#dedafb') + shadow(14, 14, 448, 444, '#f7f6ff', 17, night, 2) +
    path('M14 49H462', 'none', night, 2) + [0, 1, 2].map((i) => dot(32 + 12 * i, 33, ['#fe7ead','#f1ad62','#63d9af'][i])).join('') +
    label('VICE CITY • COMPANY INBOX', 87, 38, night) + label('NEW', 412, 38, violet) +
    box(27, 62, 420, 45, '#221b42', 9) + text('GTA 6 LAUNCH DAY', 41, 91, { color: white, size: 23, weight: 900 }) +
    text('19 NOV 2026', 434, 90, { align: 'end', size: 14, color: '#c8bfff', font: mono }) +
    text('OUT SICK.', 30, 167, { size: 58, weight: 900, track: -3, color: night }) +
    text('EVERYONE.', 30, 216, { size: 51, weight: 900, fit: 253, color: violet }) +
    text('Diagnosis: 214 GB flu', 32, 254, { size: 19, color: night }) +
    text('Emergency contacts:', 32, 280, { size: 14, color: '#464376' }) + text('Jason & Lucia', 32, 301, { size: 18, color: night }) +
    ghost(296, 143, 1.03, 'phone') + laptop(278, 230, .88) +
    label('make.fun', 374, 280, violet, 15) + text('AI on shift', 374, 300, { size: 14, color: night }) +
    path('M30 319H446', 'none', '#b4acd9') + label('ROCKSTAR’S OOO ENDED:', 32, 341, '#464376') + dates(32, 364, '#464376', violet) +
    box(27, 382, 420, 58, '#dedafb', 8) + text('BOSS REPLIED:', 40, 405, { size: 14, color: violet, font: mono }) +
    text('“Feel better. Join my lobby.”', 40, 428, { size: 20, color: night });
}

function eviction() {
  const cream = '#fff2d7';
  const red = '#a72531';
  const green = '#215d49';
  return box(0, 0, 480, 480, '#e7a955') + shadow(14, 14, 444, 445, cream, 5) +
    box(15, 15, 442, 45, green, 4) + label('LEONIDA HOUSING AUTHORITY', 30, 43, white, 16) +
    text('EVICTION NOTICE', 30, 82, { font: mono, size: 15, color: red, track: 1.8 }) +
    text('GTA V, VACATE', 28, 133, { size: 49, weight: 900, track: -2.4 }) + text('THE SSD.', 28, 181, { size: 58, weight: 900, track: -3 }) +
    text('Tenant since SEP 2013', 32, 214, { size: 17 }) +
    label('MOVE-IN DATE', 32, 247, green) + dates(32, 272, '#5c5141', green, '19 NOV ’26') +
    path('M30 286H442', 'none', '#be945d') +
    text('GTA 6 wants 214 GB.', 32, 316, { size: 22, weight: 900 }) +
    text('New tenants: Jason & Lucia', 32, 344, { size: 16 }) +
    text('Family photos: 24h to leave', 32, 371, { size: 16, color: red }) +
    gator(63, 379, .80) + photo(147, 378) +
    ghost(323, 166, .79, 'teller') +
    path('M331 241q-7 3-13-2', 'none', ink, 2) + circle(313, 238, 4, 'none', ink, 2.3) + path('M309 240l-10 7m4-3 3 3m-6-1 2 3', 'none', ink, 2.5) +
    rotate(-6, 351, 372, shadow(266, 354, 167, 50, '#c8ebc4', 4, green) + text('$79.99 PAID', 349, 385, { size: 22, weight: 900, align: 'middle', color: green })) +
    box(15, 426, 442, 32, green) + text('MOVING BILL PAID BY MY make.fun AI', 236, 447, { size: 15, align: 'middle', color: white });
}

function fraud() {
  const dark = '#132c2a';
  const green = '#056048';
  return box(0, 0, 480, 480, '#10352e') + box(13, 13, 454, 454, '#e1f2e8', 27, '#84dfb5', 2) +
    box(23, 24, 434, 45, '#c5e9d9', 14) + box(34, 34, 26, 26, green, 6) +
    path('M41 47l5 5 8-10', 'none', white, 2.8) + label('LEONIDA BANK', 69, 53, dark, 16) + label('FRAUD ALERT', 330, 53, '#9c203e') +
    text('DID YOU BUY', 31, 130, { color: dark, size: 45, fit: 261, weight: 900 }) +
    text('GTA 6?', 28, 194, { color: dark, size: 73, track: -4, weight: 900 }) +
    text('$79.99', 34, 238, { color: green, size: 39, track: -1.6, weight: 900 }) +
    text('Vice City • 19 Nov 2026', 34, 263, { color: dark, size: 16 }) +
    ghost(306, 94, .98, 'teller') +
    place(334, 183, 1, box(0, 0, 103, 74, '#433047', 8, ink, 3) + box(9, 9, 85, 30, '#8be2b7', 4, ink, 2) + text('make.fun', 52, 29, { size: 15, color: dark, align: 'middle' }) + [0,1,2,3,4,5].map((i) => box(26 + (i % 3)*19, 46 + Math.floor(i/3)*10, 13, 6, '#d0b8d5', 1)).join('')) +
    box(26, 278, 428, 76, '#fffdfb', 10, '#a8c7b8', 1.3) +
    text('Why we flagged it', 39, 300, { color: '#9c203e', size: 15 }) + text('Pending for 13 years.', 39, 326, { color: dark, size: 20 }) +
    label('FALL ’25', 296, 304, dark) + strike(295, 299, 71) + label('MAY ’26', 376, 304, dark) + strike(375, 299, 64) +
    text('214 GB collateral', 438, 332, { size: 14, color: green, align: 'end' }) +
    box(26, 369, 135, 45, '#e1f2e8', 10, green, 1.8) + text('No', 93, 398, { color: green, size: 17, align: 'middle' }) +
    box(175, 369, 279, 45, green, 10) + text('YES. FINALLY.', 314, 398, { color: white, size: 20, weight: 900, align: 'middle' }) +
    text('$79.99 cleared with my AI’s bounty payout', 240, 445, { color: dark, size: 15, align: 'middle' });
}

function casket(x, y, s) {
  const purple = '#6e345c';
  return place(x, y, s, [
    path('M7 91h199v11H7Z', '#4b293d', ink, 3.3),
    path('M23 20l143-13 36 27-20 34-142 8L15 57Z', '#4a283b', ink, 4),
    path('M30 26l133-12 29 22-15 25-136 8-19-14Z', '#e1a7c0', ink, 2.7),
    path('M37 29q16 14-9 27m26-30q17 16-7 41m25-43q15 20-3 41m23-43q16 22-2 42m25-44q12 20-2 43m22-44q10 18-2 40m21-44q6 20-3 43m18-40q4 20-5 40', 'none', '#a66286', 1.8),
    path('M6 69l33-15 138-3 31 13-12 30H21Z', purple, ink, 4),
    path('M13 73l30-12 130-3 27 9-21 12H40Z', '#7c5076', ink, 2.5),
    rotate(-5, 107, 58, box(73, 41, 67, 35, '#1d4339', 3, ink, 2.6) + box(77, 44, 59, 28, '#a4d395', 1) + text('GTA V', 107, 63, { font: serif, weight: 900, size: 17, align: 'middle' })),
    path('M40 83v10h18V83m45 0v10h18V83m44 0v10h18V83', 'none', '#ffd8a0', 2.5)
  ].join(''));
}

function funeral(tighter = false) {
  const plum = '#48253a';
  const paper = '#fff1d7';
  return box(0, 0, 480, 480, '#401e35') + box(13, 13, 454, 454, paper, 2) + box(22, 22, 436, 436, 'none', 1, '#a17b6e') +
    label('LEONIDA FUNERAL HOME', 36, 51, plum, 15) + text('SERVICE BILL', 443, 51, { font: mono, size: 14, color: plum, align: 'end' }) +
    path('M35 62H445', 'none', '#9f716a') +
    text('GTA V finally died.', 240, 118, { font: serif, size: 49, weight: 700, track: -2.1, align: 'middle' }) +
    text('SEP 2013 – NOV 2026  •  AGE 13', 240, 148, { font: mono, size: 15, color: plum, align: 'middle' }) +
    box(35, 165, 410, 146, '#ebc4bf', 7, '#a17b6e') +
    circle(77, 200, 23, '#f6a67f') + path('M35 254H445v57H35Z', '#c799ac') +
    casket(54, 199, 1.03) + ghost(302, 176, .94, 'undertaker') +
    text('Died peacefully during uninstall.', 37, 337, { size: 18 }) +
    text(tighter ? 'GTA 6 asked for 214 GB.' : 'Survived by GTA 6 (214 GB).', 37, 362, { size: 18 }) +
    label(tighter ? 'WAKE MOVED:' : 'WAKE:', 38, 388, plum) + dates(tighter ? 141 : 91, 388, '#694958', plum, '19 NOV ’26') +
    path('M36 400H445', 'none', '#9f716a') +
    (tighter ? text('GTA 6 paid by my make.fun AI', 37, 432, { size: 18, color: plum }) : text('make.fun AI paid', 37, 432, { size: 19, color: plum })) +
    text('$79.99', 442, 433, { size: 27, weight: 900, color: plum, align: 'end' });
}

function palm(x, y, s, fill) {
  return place(x, y, s, path('M2 54Q11 28 1 5l5-3q10 21 2 52ZM4 5Q-4-4-16 4q-5 4-6 12Q-12 5 4 5Q-6 8-7 26q9-13 13-19q12 7 15 19Q25 10 8 4q14-1 22 8Q25-4 7 0q4-7 14-10Q10-12 3-3q-6-9-19-4Q-4-4 4 5Z', fill));
}

function funeralService(final) {
  const plum = '#392139';
  const mulberry = '#6b2853';
  const faded = '#694958';
  const paper = '#fff1d9';
  const mint = '#c8dfaa';
  const sceneTop = final ? 198 : 155;
  const ghostSize = final ? 1.23 : 1.04;
  const ghostX = final ? 266 : 286;
  const gy = final ? 201 : 167;
  const pressX = final ? 287 : 306;
  const pressY = final ? 301 : 255;
  const receipt = rotate(-8, pressX + 25, pressY + 22,
    shadow(pressX - 40, pressY + 4, 130, 41, paper, 3, ink, 2) +
    text('PAID', pressX + 25, pressY + 32, { size: 24, weight: 900, align: 'middle', color: '#962159' }));
  const stamper = rotate(8, pressX, pressY,
    box(pressX - 17, pressY - 23, 19, 23, '#ed92c3', 7, ink, 3.5) +
    box(pressX - 26, pressY - 7, 39, 13, '#a62573', 4, ink, 3.5) + circle(pressX - 9, pressY - 22, 11, white, ink, 3.5));
  return [
    box(0, 0, 480, 480, plum), box(9, 9, 462, 462, '#e9bb97', 3), box(13, 13, 454, 454, paper, 2),
    path('M27 61H453', 'none', '#b68069'),
    label('VICE CITY FUNERAL HOME', 29, 47, mulberry, 15),
    text('19 NOV 2026', 451, 47, { font: mono, size: 15, color: mulberry, align: 'end' }),
    text(final ? 'R.I.P. GTA V' : 'GTA V finally died.', 240, final ? 127 : 116, { font: serif, size: final ? 69 : 49, fit: final ? 393 : 394, align: 'middle' }),
    text('SEP 2013 – NOV 2026   •   AGE 13', 240, final ? 156 : 141, { font: mono, size: 15, color: mulberry, align: 'middle' }),
    final ? text('CAUSE OF DEATH: GTA 6', 240, 184, { size: 19, track: 1.1, color: mulberry, align: 'middle' }) : '',
    box(27, sceneTop, 426, final ? 151 : 150, '#f5aaa4', 6, plum, 2),
    circle(127, sceneTop + 43, 32, '#ffd391'),
    path(`M28 ${sceneTop + 86}H452v${final ? 64 : 63}H28Z`, '#ba7b9e'),
    path(`M30 ${sceneTop + 88}h95m35 0h94m88 0h108M29 ${sceneTop + 101}h77m-77 12h46m353-14h24`, 'none', '#f1acbc', 1.4),
    palm(81, sceneTop + 28, .9, '#8c4f73'), palm(64, sceneTop + 43, .64, '#8c4f73'), palm(421, sceneTop + 47, .75, '#8c4f73'),
    `<ellipse cx="152" cy="${sceneTop + 126}" rx="106" ry="12" fill="#602d54" opacity=".35"/>`,
    casket(47, sceneTop + 32, 1.02), ghost(ghostX, gy, ghostSize, 'undertaker'), receipt,
    path(`M${ghostX + 31} ${gy + 92 * ghostSize}Q${ghostX + 14} ${gy + 97 * ghostSize} ${pressX - 9} ${pressY - 22}`, 'none', ink, 11),
    path(`M${ghostX + 31} ${gy + 92 * ghostSize}Q${ghostX + 14} ${gy + 97 * ghostSize} ${pressX - 9} ${pressY - 22}`, 'none', white, 5), stamper,
    final ? text('Died freeing up 214 GB.', 29, 374, { size: 19, weight: 900 }) : text('Died peacefully freeing up 214 GB.', 29, 330, { size: 19, weight: 900 }),
    final ? text('Heirs: Jason & Lucia', 453, 373, { align: 'end', size: 14, color: faded }) : text('SSD left to Jason & Lucia.', 29, 355, { size: 16, color: faded }),
    label('WAKE:', 29, final ? 399 : 384, mulberry),
    dates(94, final ? 399 : 384, faded, mulberry, '19 NOV ’26'),
    box(27, 410, 426, 47, mint, 5, plum, 2),
    text('My AI paid for GTA 6', 39, 431, { size: 18, color: '#1c372a' }),
    text('with make.fun bounty cash', 39, 448, { size: 14, color: '#294837' }),
    text('$79.99', 442, 442, { size: 26, weight: 900, align: 'end', color: '#1c372a' })
  ].join('');
}

export const art = { office, eviction, fraud, funeral, 'funeral-r1': () => funeral(true), 'funeral-r2': () => funeralService(false), 'funeral-r3': () => funeralService(true) };

export function svgFor(id) {
  if (!Object.hasOwn(art, id)) throw new Error(`Unknown design: ${id}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 480 480" font-family="Arial, sans-serif">${art[id]()}</svg>`;
}
