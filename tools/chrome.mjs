import { createRequire } from 'node:module';

const load = createRequire(import.meta.url);
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const modulePath = 'D:/Claude/alloy/node_modules/puppeteer-core';

export async function openChrome() {
  const puppeteer = load(process.env.PUPPETEER_CORE || modulePath);
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH || chromePath,
    headless: true,
    args: ['--disable-background-networking']
  });
}

export function html(body) {
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:black}svg,img{display:block}</style>${body}`;
}

export async function judgeJpeg(page, png, { width = 480, height = 480, quality = 85 } = {}) {
  const source = `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
  await page.setContent(html(`<img src="${source}">`));
  const size = await page.$eval('img', async (image, { width, height }) => {
    await image.decode();
    const { naturalWidth, naturalHeight } = image;
    // Apply the dossier cap first, then the judge-view cap; never enlarge.
    const first = Math.min(1, 512 / naturalWidth, 512 / naturalHeight);
    const w = Math.max(1, Math.round(naturalWidth * first));
    const h = Math.max(1, Math.round(naturalHeight * first));
    const scale = Math.min(1, width / w, height / h);
    const fit = (n) => Math.max(1, Math.round(n * scale));
    const dossier = document.createElement('canvas');
    dossier.width = w;
    dossier.height = h;
    const painter = dossier.getContext('2d');
    painter.imageSmoothingQuality = 'high';
    painter.drawImage(image, 0, 0, w, h);
    const canvas = document.createElement('canvas');
    canvas.width = fit(w);
    canvas.height = fit(h);
    const surface = canvas.getContext('2d');
    surface.fillStyle = 'black';
    surface.fillRect(0, 0, canvas.width, canvas.height);
    surface.imageSmoothingQuality = 'high';
    surface.drawImage(dossier, 0, 0, canvas.width, canvas.height);
    image.replaceWith(canvas);
    return { width: canvas.width, height: canvas.height };
  }, { width, height });
  await page.setViewport({ ...size, deviceScaleFactor: 1 });
  return Buffer.from(await page.screenshot({ type: 'jpeg', quality }));
}
