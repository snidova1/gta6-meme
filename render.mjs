import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_CORE ?? 'D:/Claude/alloy/node_modules/puppeteer-core');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ink = '#21182e';

function star(x, y, radius, spikes = 4) {
  const points = Array.from({ length: spikes * 2 }, (_, i) => {
    const angle = i * Math.PI / spikes - Math.PI / 2;
    const r = i % 2 ? radius * (spikes === 5 ? 0.51 : 0.32) : radius;
    return `${(x + Math.cos(angle) * r).toFixed(2)},${(y + Math.sin(angle) * r).toFixed(2)}`;
  });
  return points.join(' ');
}

function palm(x, y, scale, mirror = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale * mirror} ${scale})" fill="#552b57">
    <path d="M-15 224Q9 104 48 18L56 23Q24 132 9 224Z"/>
    <path d="M51 26Q9 -1 -74 28Q-38 -12 15 0Q-30 -26 -66 -15Q-9 -53 47 3Q21 -34 -2 -49Q48 -49 58 3Q87 -39 135 -29Q98 -14 73 7Q126 -9 162 21Q103 9 78 21Q126 28 140 68Q94 37 62 29Q56 57 69 84Q41 64 49 35Q16 47 -6 80Q1 44 35 26Z"/>
  </g>`;
}

const skyline = [[117,56,78],[181,37,117],[226,46,89],[284,31,136],[324,54,105],[393,53,67],[468,42,88],[519,31,110],[555,45,63],[634,37,104],[687,51,72],[741,32,131],[784,40,104],[833,62,78],[915,34,99],[958,55,127],[1024,30,68]].map(([x,w,h],i) => `<path fill="${i % 2 ? '#815077' : '#98567f'}" d="M${x} 514v-${h}h${w}v${h}z"/>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-label="After a thirteen-year wait for GTA 6, a fan watches the install stick at 99 percent while their make.fun ghost retires on a Vice City beach.">
<defs>
  <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#8c478e"/><stop offset=".7" stop-color="#f47e9b"/><stop offset="1" stop-color="#ffba8e"/></linearGradient>
  <linearGradient id="water" x2="0" y2="1"><stop stop-color="#6a5795"/><stop offset="1" stop-color="#3a8eaa"/></linearGradient>
  <linearGradient id="sand" x2="0" y2="1"><stop stop-color="#ffc49a"/><stop offset="1" stop-color="#e5878c"/></linearGradient>
  <clipPath id="scene"><rect x="32" y="195" width="1136" height="766" rx="38"/></clipPath>
  <style>
    text { font-family: 'Arial', sans-serif; }
    .bold { font-weight: 900; }
    .mono { font-family: Consolas, monospace; font-weight: bold; }
    .line { stroke: ${ink}; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</defs>
<rect width="1200" height="1200" fill="#231932"/>
<path d="M0 9H1200" stroke="#ec529e" stroke-width="18"/>
<text class="bold" x="600" y="143" text-anchor="middle" font-size="102" letter-spacing="-4" fill="#fff3db">13 YEARS FOR GTA 6.</text>
<g clip-path="url(#scene)">
  <rect x="32" y="195" width="1136" height="400" fill="url(#sky)"/>
  <circle cx="851" cy="400" r="145" fill="#ffc983"/>
  <path d="M732 435h236m-225 22h215m-198 22h179" stroke="#f79491" stroke-width="6"/>
  <g opacity=".90">${skyline}</g>
  <path d="M32 509Q450 493 795 511T1168 511V694H32Z" fill="url(#water)"/>
  <path d="M78 545H245m113 -10h207m182 20h167m-630 24h129m229 24h193m-672 18h137" fill="none" stroke="#f4bdba" stroke-width="5" opacity=".46" stroke-linecap="round"/>
  <path d="M32 685Q375 716 642 655T1168 615V961H32Z" fill="url(#sand)"/>
  <path d="M32 683Q373 714 642 653T1168 613" fill="none" stroke="#ffe1bd" stroke-width="12"/>
  ${palm(68,267,1.30)}${palm(1132,293,1.22,-1)}
  <g transform="translate(87 232)">
    <rect width="204" height="53" rx="26" fill="#352344"/>
    <text class="mono" font-size="26" fill="#ffddd3" x="102" y="35" text-anchor="middle">VICE CITY</text>
  </g>

  <!-- The television and its stubborn final sliver. -->
  <ellipse cx="334" cy="868" rx="251" ry="35" fill="#803e66" opacity=".32"/>
  <path class="line" d="M150 697h251l68 54H96Z" fill="#a64975" stroke-width="9"/>
  <path class="line" d="M96 751h373v46H96zM129 798v37m302-37v37" fill="#773c64" stroke-width="12"/>
  <path class="line" d="M252 563h61l14 142h-91Z" fill="#452b4c" stroke-width="10"/>
  <rect class="line" x="79" y="352" width="407" height="228" rx="28" fill="#3b2647" stroke-width="13"/>
  <rect x="98" y="371" width="369" height="189" rx="15" fill="#211b35"/>
  <text class="bold" x="121" y="444" font-size="58" letter-spacing="-2" fill="#ffd4a0">GTA VI</text>
  <text class="mono" x="124" y="492" font-size="28" fill="#f6c4d7">INSTALLING</text>
  <text class="mono" x="447" y="499" font-size="69" fill="#fff5e4" text-anchor="end">99%</text>
  <rect x="124" y="515" width="319" height="19" rx="9.5" fill="#6c4d78"/>
  <rect x="124" y="515" width="308" height="19" rx="9.5" fill="#ef5aa9"/>

  <!-- Older player in a beach chair, still gripping the gamepad. -->
  <g class="line" stroke-width="10">
    <path d="M431 745l-68 152m108-79l73 75m-175-42h143" fill="none" stroke-width="14"/>
    <path d="M507 701l40 85-42 71H321l-22-31 161-25-25-94Z" fill="#377c82"/>
    <path d="M335 800l-27 44-71 18-8-15 62-37 18-38Z" fill="#7c5e88"/>
    <path d="M462 762q-9 56-74 67l-60 1-39 43-50-8 56-83 89-16Z" fill="#594463"/>
    <path d="M284 868q10 28-25 28h-64q-16-1-12-15 8-18 57-23Z" fill="#f3ad70"/>
    <path d="M424 675q45 3 62 48l14 64q-63 35-135 3l11-73Z" fill="#e7697f"/>
    <path d="M383 711q-9 26-30 45l-42-11-12-23-24-4q-19-2-14 14l29 32 61 21q28 6 61-38" fill="#de956e"/>
    <path d="M370 707q-20-14-13-43l-11-4q-10-4-1-15l13-18q-2-44 31-59 58-27 86 27 13 31-12 72l1 24-46 17-15-15q-8 17-33 14Z" fill="#e9a078"/>
    <path d="M353 620q-8-28 12-46 12-11 33-12 17-12 47 0 39 13 39 49 0 34-27 53l-12-31-11-12-21 5-7-20q-16 15-53 14Z" fill="#dad7e2"/>
    <path d="M359 671q17 13 40 0l16 4q-4 36-23 43-20 5-30-10Z" fill="#e7dfeb"/>
    <path d="M362 638l17 3" stroke-width="7"/>
    <path d="M252 718q2-16 19-18l13 8 18-3q13 6 21 25 4 16-9 17l-18-11-22 2q-19 14-23-1Z" fill="#fff2d4" stroke-width="7"/>
    <path d="M272 715v11m-5-6h10m24 0h1m7 5h1" stroke="#71335f" stroke-width="4"/>
  </g>

  <!-- Retirement lounger. The ghost's hand and coin overlap the scene. -->
  <ellipse cx="837" cy="871" rx="283" ry="43" fill="#803e66" opacity=".34"/>
  <g class="line" stroke-width="12">
    <path d="M689 788l-50 73m273-60l57 65m-252-17h193" fill="none"/>
    <path d="M607 779l252-34 120-155 55 40-113 179-290 41Z" fill="#fa9e79"/>
    <path d="M620 793l246-34 122-158 26 24-106 159-280 44Z" fill="#169f9c" stroke="none"/>
    <path d="M672 786l10 35m50-43l11 35m48-43l11 35m61-65l31 19m7-67l32 19m4-69l31 19" fill="none" stroke="#f6d69c" stroke-width="16"/>
  </g>
  <g transform="translate(625 435)">
    <path class="line" stroke-width="14" fill="#fffdf5" d="M74 274Q49 295 25 276Q0 256 30 223Q46 206 49 172L56 115Q62 50 114 25Q163 0 215 24Q272 47 278 111L294 204Q311 246 283 289Q259 322 212 316Q178 311 165 293Q146 321 109 314Q77 311 74 274Z"/>
    <path d="M78 271Q93 296 116 293Q145 288 162 273Q188 293 222 295Q267 296 290 254Q285 297 253 307Q208 323 165 293Q136 322 106 314Q82 308 78 271Z" fill="#ebdbe9"/>
    <path class="line" d="M73 271q-4-15 6-32" fill="none" stroke-width="12"/>
    <polygon points="${star(125,154,29)}" fill="${ink}"/>
    <polygon points="${star(206,137,32)}" fill="${ink}"/>
    <path class="line" d="M268 191q37 22 70-15l-26-38-42 16" fill="#fffdf5" stroke-width="13"/>
    <circle class="line" cx="337" cy="112" r="67" fill="#c01680" stroke-width="13"/>
    <circle cx="337" cy="112" r="53" fill="none" stroke="#f073b6" stroke-width="4"/>
    <polygon points="${star(337,112,40,5)}" fill="#fffdf5" stroke="#fffdf5" stroke-width="3" stroke-linejoin="round" transform="rotate(-12 337 112)"/>
    <circle class="line" cx="309" cy="173" r="33" fill="#fffdf5" stroke-width="13"/>
  </g>
  <g transform="translate(933 792)">
    <path class="line" d="M39 18v-9q0-9 11-9h68q11 0 11 9v9" fill="none" stroke-width="8"/>
    <rect class="line" y="28" width="208" height="113" rx="17" fill="#f6a2c8" stroke-width="9"/>
    <rect class="line" x="-5" y="15" width="218" height="26" rx="10" fill="#fff2d4" stroke-width="8"/>
    <text class="bold" x="104" y="87" text-anchor="middle" font-size="43" letter-spacing="-1.5" fill="#271b34">make.fun</text>
    <text class="mono" x="104" y="117" text-anchor="middle" font-size="25" fill="#671d52">BOUNTY PAID</text>
  </g>
</g>
<rect x="32" y="195" width="1136" height="766" rx="38" fill="none" stroke="#422a49" stroke-width="5"/>
<text class="bold" x="600" y="1100" text-anchor="middle" font-size="93" letter-spacing="-3.5" fill="#ffb8da">MY AI RETIRED FIRST.</text>
</svg>`;

await mkdir(new URL('out/', import.meta.url), { recursive: true });
await writeFile(new URL('out/meme.svg', import.meta.url), svg);
const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0}svg{display:block}</style>${svg}`);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await writeFile(new URL('meme.png', import.meta.url), png);
  // Shrink the actual PNG for a judge-sized JPEG preview.
  await page.setViewport({ width: 480, height: 480, deviceScaleFactor: 1 });
  await page.setContent(`<style>body{margin:0;background:#000}img{display:block;width:480px;height:480px}</style><img src="data:image/png;base64,${Buffer.from(png).toString('base64')}">`);
  await page.$eval('img', (image) => image.decode());
  const preview = await page.screenshot({ type: 'jpeg', quality: 85 });
  await writeFile(new URL('out/judge-480.jpg', import.meta.url), preview);
} finally {
  await browser.close();
}
