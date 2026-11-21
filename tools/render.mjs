import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { openChrome, html, judgeJpeg } from './chrome.mjs';
import { art, svgFor } from './illustrate.mjs';
import { postFor, postLength } from './copy.mjs';

const argv = process.argv.slice(2);
const select = argv[0] === '--select';
if (select) argv.shift();
const ids = argv.length ? argv : Object.keys(art);
if (select && argv.length !== 1) throw new Error('--select needs exactly one candidate ID');
const candidatePath = new URL('../candidates/', import.meta.url);
const outputPath = new URL('../out/', import.meta.url);

if (select) {
  const [id] = ids;
  if (!Object.hasOwn(art, id)) throw new Error(`Unknown candidate: ${id}`);
  const [png, post] = await Promise.all([
    readFile(new URL(`${id}.png`, candidatePath)), readFile(new URL(`${id}.txt`, candidatePath), 'utf8')
  ]);
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 1200) throw new Error(`Invalid candidate image: ${id}`);
  if (post !== postFor(id) + '\n' || postLength(post.trimEnd()) > 280) throw new Error(`Invalid candidate copy: ${id}`);
  // Promote the exact reviewed bytes. Do not rerender an approved candidate.
  await Promise.all([writeFile(new URL('../meme.png', import.meta.url), png), writeFile(new URL('../post.txt', import.meta.url), post)]);
  console.log(`${id}: selected the existing PNG and post`);
} else {
  await render(ids);
}

async function render(ids) {
await Promise.all([mkdir(candidatePath, { recursive: true }), mkdir(outputPath, { recursive: true })]);

const browser = await openChrome();
try {
  const page = await browser.newPage();
  for (const id of ids) {
    const svg = svgFor(id);
    const post = postFor(id);
    const size = postLength(post);
    if (size > 280) throw new Error(`${id}: post weighs ${size}, limit is 280`);
    await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 });
    await page.setContent(html(svg));
    const issues = await page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.querySelectorAll('svg text')).flatMap((node) => {
        const b = node.getBoundingClientRect();
        const bad = b.x < 0 || b.y < 0 || b.right > 1200 || b.bottom > 1200 || parseFloat(node.getAttribute('font-size')) < 14;
        return bad ? [`${node.textContent}: ${Math.round(b.x)},${Math.round(b.y)} to ${Math.round(b.right)},${Math.round(b.bottom)}`] : [];
      });
    });
    if (issues.length) throw new Error(`${id} has small or clipped text: ${issues.join('; ')}`);
    const png = await page.screenshot({ type: 'png' });
    const preview = await judgeJpeg(page, png);
    await Promise.all([
      writeFile(new URL(`${id}.png`, candidatePath), png),
      writeFile(new URL(`${id}.txt`, candidatePath), post + '\n'),
      writeFile(new URL(`${id}.svg`, outputPath), svg),
      writeFile(new URL(`${id}-480.jpg`, outputPath), preview)
    ]);
    console.log(`${id}: rendered 1200 × 1200; 480 × 480 preview; X weight ${size}`);
  }
} finally {
  await browser.close();
}
}
