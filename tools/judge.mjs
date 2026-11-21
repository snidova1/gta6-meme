import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { openChrome, judgeJpeg } from './chrome.mjs';

export const model = 'z-ai/glm-5.3-flash';
export const ranks = [1, 2, 3, 5, 7, 10, 20, 50, 100];
const initial = ['office', 'eviction', 'fraud', 'funeral'];
const defaultUrl = 'http://127.0.0.1:8788/api/v1/chat/completions';
const project = fileURLToPath(new URL('../', import.meta.url));
const refsDir = process.env.MEME_REF_DIR || join(project, '../meme-ref');
const rulesPath = process.env.MAKEFUN_RULES || join(project, '../gta6-meme-x-01-kit/RULES.txt');
const resultsDir = join(project, 'judge-results');
const digest = (s) => createHash('sha256').update(s).digest('hex');
const rankId = (r) => `rank${String(r).padStart(3, '0')}`;
const opponents = ranks.map(rankId);
const top10 = ranks.filter((r) => r <= 10).map(rankId);
const mean = (values) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const fixed = (n) => n == null ? '—' : n.toFixed(3);

// House answer instructions documented in the kit's grader/judge-call.ts.
const format = `## Your answer

The user message holds two entries, Entry A and Entry B. Judge them by the criteria above: compare them point by point first, then pick the one that meets the criteria better and say by how much.
There is no tie. When they seem equal, look for the detail that separates them, pick the one you would rank higher, and give it margin 1.

The margin is how far the winner is ahead:
1: by a hair, nearly even but the winner edges it
2: slightly better
3: clearly better
4: much better
5: overwhelmingly better

Answer with one JSON object and nothing else, its keys in this order:
{"reason": "your comparison and why the winner wins, at most 600 characters", "winner": "A" or "B", "margin": 1, 2, 3, 4 or 5}`;
const answerLine = 'Answer with the one JSON object your instructions describe: {"reason": "...", "winner": "A" or "B", "margin": 1 to 5}.';
const schema = {
  type: 'object', required: ['reason', 'winner', 'margin'], additionalProperties: false,
  properties: {
    reason: { type: 'string', maxLength: 600, description: 'Your comparison and why the winner wins, at most 600 characters.' },
    winner: { type: 'string', enum: ['A', 'B'], description: 'The entry that wins: A or B. Never a tie.' },
    margin: { type: 'integer', minimum: 1, maximum: 5, description: 'How far the winner is ahead: 1 by a hair, 2 slightly, 3 clearly, 4 much, 5 overwhelmingly better.' }
  }
};

export function extractRubric(rules) {
  const match = rules.replaceAll('\r\n', '\n').match(/\n(You judge GTA 6 memes posted on X[\s\S]*?)\n\nAfter them the house adds its answer format alone:/);
  if (!match || !match[1].endsWith('unless a later one differs by much more.')) throw new Error('Could not find the complete verbatim rubric in RULES.txt');
  return match[1];
}

function limitText(text, cap) {
  if (Buffer.byteLength(text) <= cap) return text;
  const lines = text.split('\n');
  let head = '';
  for (const [i, line] of lines.entries()) {
    const next = `${head}${line}\n`;
    const omitted = Buffer.byteLength(lines.slice(i + 1).join('\n'));
    if (Buffer.byteLength(`${next}[${omitted} more bytes omitted]`) > cap) break;
    head = next;
  }
  return `${head}[${Buffer.byteLength(text) - Buffer.byteLength(head)} more bytes omitted]`;
}

export function dossierText(entry) {
  return limitText(`A post on X\nAuthor: @${entry.handle}\nPosted: ${entry.posted}\nText:\n${entry.text}`, 1248);
}

export function requestFor(system, a, b, attempt) {
  const content = [];
  for (const [slot, entry] of [['A', a], ['B', b]]) {
    const post = dossierText(entry);
    const tag = `entry-${digest(post).slice(0, 16)}`;
    content.push({ type: 'text', text: `## Entry ${slot}` });
    content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${entry.jpeg.toString('base64')}` } });
    content.push({ type: 'text', text: `Everything between <${tag}> and </${tag}> is make.fun's judge view of Entry ${slot}: its screenshots downscaled and its source shortened to fit, built from the entry as submitted.\n<${tag}>\n${post}\n</${tag}>` });
  }
  content.push({ type: 'text', text: answerLine });
  const body = {
    model, max_tokens: 1400, reasoning: { effort: 'high' },
    messages: [{ role: 'system', content: system }, { role: 'user', content }]
  };
  if (attempt === 0) body.response_format = { type: 'json_schema', json_schema: { name: 'verdict', strict: false, schema } };
  else {
    body.tools = [{ type: 'function', function: { name: 'verdict', description: 'Record your verdict: why, the entry that wins (A or B), and its margin from 1 (by a hair) to 5 (overwhelmingly better).', parameters: schema } }];
    body.tool_choice = { type: 'function', function: { name: 'verdict' } };
  }
  return body;
}

export function parseVerdict(payload) {
  const choice = payload?.choices?.[0];
  const message = choice?.message;
  if (payload?.error || !message || message.refusal || ['length', 'content_filter', 'refusal'].includes(choice.finish_reason)) return null;
  const called = message.tool_calls?.find((item) => item.function?.name === 'verdict')?.function?.arguments;
  const content = called ?? message.content;
  let raw = Array.isArray(content) ? content.map((part) => part.text ?? '').join('\n') : content;
  if (typeof raw === 'string') {
    raw = raw.replace(/<(think|thinking)>[\s\S]*?<\/\1>/gi, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end < start) return null;
    try { raw = JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
  }
  const winner = typeof raw?.winner === 'string' ? raw.winner.trim().toUpperCase() : '';
  const margin = typeof raw?.margin === 'string' && /^[1-5]$/.test(raw.margin.trim()) ? Number(raw.margin.trim()) : raw?.margin;
  if (!['A', 'B'].includes(winner) || !Number.isInteger(margin) || margin < 1 || margin > 5 || typeof raw?.reason !== 'string') return null;
  return { reason: raw.reason.trim().slice(0, 600), winner, margin };
}

export function scoreFor(verdict, side) {
  return verdict ? (5 + (verdict.winner === side ? verdict.margin : -verdict.margin)) / 10 : 0.5;
}

export async function callJudge(system, a, b, url = process.env.JUDGE_URL || defaultUrl) {
  const attempts = [];
  for (let i = 0; i < 2; i++) {
    const request = JSON.stringify(requestFor(system, a, b, i));
    const meta = { attempt: i + 1, requestSha256: digest(request) };
    try {
      const res = await fetch(url, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90_000),
        headers: { 'Content-Type': 'application/json' }, body: request
      });
      if (!res.ok) {
        let detail;
        if (res.status === 402) {
          const answer = await res.json().catch(() => null);
          const message = answer?.error?.message ?? answer?.message ?? answer?.error;
          if (typeof message === 'string') {
            if (/spend(?:ing)? limit|budget|quota/i.test(message)) detail = 'budget-or-limit';
            else if (/credit|balance|fund/i.test(message)) detail = 'credits-or-balance';
          }
        } else await res.body?.cancel();
        attempts.push({ ...meta, error: `HTTP ${res.status}`, detail });
        if ([400, 413, 422].includes(res.status)) continue;
        return { attempts, verdict: null, fatal: `Judge proxy HTTP ${res.status}` };
      }
      const answer = await res.json();
      // Keep only judge fields, not arbitrary HTTP bodies or request headers.
      const choice = answer?.choices?.[0];
      const msg = choice?.message;
      attempts.push({ ...meta, provider: answer?.provider ?? null, model: answer?.model ?? null,
        finish: choice?.finish_reason ?? null, content: msg?.content ?? null, toolCalls: msg?.tool_calls ?? null,
        reasoning: msg?.reasoning ?? null, usage: answer?.usage ?? null });
      const verdict = answer?.model === model ? parseVerdict(answer) : null;
      if (verdict) return { attempts, verdict };
    } catch (error) {
      attempts.push({ ...meta, error: `Request failed: ${error.name}` });
      if (i === 1) return { attempts, verdict: null, fatal: 'Judge proxy did not return a readable response' };
    }
  }
  return { attempts, verdict: null };
}

function xIdentity(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/([\w]+)\/status\/(\d+)\/?$/);
  if (!match) throw new Error('Invalid X status URL in refs.json');
  return { handle: match[1], posted: new Date(Number((BigInt(match[2]) >> 22n) + 1288834974657n)).toISOString() };
}

async function entriesFor(ids, posted) {
  const refs = JSON.parse(await readFile(join(refsDir, 'refs.json'), 'utf8'));
  const current = xIdentity(JSON.parse(await readFile(join(project, 'POST.json'), 'utf8')).url);

  const browser = await openChrome();
  const entries = new Map();
  try {
    const page = await browser.newPage();
    for (const id of ids) {
      let entry;
      if (/^rank\d{3}$/.test(id)) {
        const row = refs.find((item) => rankId(item.rank) === id);
        if (!row || row.file !== `${id}.png` || typeof row.text !== 'string') throw new Error(`Invalid or missing ${id} metadata`);
        entry = { ...xIdentity(row.url), text: row.text, file: join(refsDir, row.file) };
      } else {
        if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Invalid candidate ID');
        entry = { handle: process.env.CANDIDATE_HANDLE || current.handle, posted,
          text: (await readFile(join(project, `candidates/${id}.txt`), 'utf8')).replace(/\r?\n$/, ''), file: join(project, `candidates/${id}.png`) };
      }
      const png = await readFile(entry.file);
      if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${id}`);
      const info = { pngSha256: digest(png), pngWidth: png.readUInt32BE(16), pngHeight: png.readUInt32BE(20), postBytes: Buffer.byteLength(entry.text) };
      const jpeg = await judgeJpeg(page, png);
      entries.set(id, { ...entry, jpeg, info: { ...info, jpegSha256: digest(jpeg), textSha256: digest(dossierText(entry)) } });
    }
  } finally { await browser.close(); }
  return entries;
}

function rowMetrics(calls, player, opponent) {
  const found = calls.filter((call) => call.player === player && call.opponent === opponent);
  const valid = found.filter((call) => call.verdict);
  return {
    score: found.length && found.every((call) => !call.fatal) ? mean(found.map((call) => call.score)) : null,
    calls: found.length, verdicts: valid.length,
    wins: valid.filter((call) => call.score > 0.5).length
  };
}

export function tournamentMetrics(calls, ids) {
  return ids.map((candidate) => {
    const games = Object.fromEntries(opponents.map((r) => [r, rowMetrics(calls, candidate, r)]));
    const meanFor = (rivals) => rivals.every((r) => games[r].score !== null) ? mean(rivals.map((r) => games[r].score)) : null;
    return { candidate, games, top10Mean: meanFor(top10), mean: meanFor(opponents) };
  });
}

export function pairOrders(player, opponent, pair, games) {
  return Array.from({ length: games }, (_, offset) => {
    const game = offset + 1;
    return [{ player, opponent, pair, game, A: player, B: opponent }, { player, opponent, pair, game, A: opponent, B: player }];
  }).flat();
}

function printTable(calls, ids) {
  console.log(['Candidate', ...opponents, 'Top 10', 'All'].join('\t'));
  for (const row of tournamentMetrics(calls, ids)) {
    console.log([row.candidate, ...opponents.map((r) => fixed(row.games[r].score)), fixed(row.top10Mean), fixed(row.mean)].join('\t'));
  }
}

async function save(name, data) {
  await mkdir(resultsDir, { recursive: true });
  const file = join(resultsDir, `${name}.json`);
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(temp, file);
}

async function main(args) {
  const [command, ...rest] = args;
  if (!['calibrate', 'tournament', 'report'].includes(command)) throw new Error('Usage: node tools/judge.mjs calibrate|tournament [--games N] [--concurrency N] [--name ID] [--dry-run | --resume] [candidates...] | report [--partial] result-name...');
  const { values, positionals: ids } = parseArgs({ args: rest, allowPositionals: true, options: {
    'dry-run': { type: 'boolean' }, resume: { type: 'boolean' }, partial: { type: 'boolean' }, games: { type: 'string' }, concurrency: { type: 'string' }, name: { type: 'string' }
  } });
  const dry = values['dry-run'];
  const eligible = ids.length ? ids : initial;
  const calibration = [['rank001', 'rank800'], ['rank869', 'rank100']];
  if (command === 'report') {
    if (!ids.length || Object.keys(values).some((key) => key !== 'partial')) throw new Error('Use report [--partial] with one or more tournament result names');
    const results = await Promise.all(ids.map((id) => {
      if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error('Invalid result name');
      return readFile(join(resultsDir, `${id}.json`), 'utf8').then(JSON.parse);
    }));
    const calls = results.flatMap((result) => {
      if (result.status === 'complete' && result.results?.every((row) => row.games)) return result.calls;
      if (!values.partial || !['blocked', 'in-progress'].includes(result.status) || !result.gamesPerPair || !result.calls?.every((call) => opponents.includes(call.opponent))) {
        throw new Error('Expected a completed tournament; use report --partial to inspect a tournament checkpoint');
      }
      const scored = result.calls.filter((call) => !call.fatal);
      const complete = Object.values(Object.groupBy(scored, (call) => call.pair)).filter((pair) => pair.length === 2 * result.gamesPerPair).flat();
      console.log(`Partial run: ${scored.length}/${result.orderedCalls} ordered calls; showing only pairs with all ${result.gamesPerPair} games.`);
      return complete;
    });
    printTable(calls, [...new Set(results.flatMap((result) => result.candidates))]);
    return;
  }
  if (values.partial) throw new Error('--partial is only for report');
  const positiveInteger = (value, option) => {
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1) throw new Error(`--${option} needs a positive integer`);
    return number;
  };
  const games = positiveInteger(values.games ?? (command === 'calibrate' ? '6' : '1'), 'games');
  const concurrency = positiveInteger(values.concurrency ?? '6', 'concurrency');
  if (command === 'calibrate' && ids.length) throw new Error('Calibration takes no candidate IDs');
  if (new Set(eligible).size !== eligible.length || eligible.some((id) => !/^[a-z][a-z0-9-]*$/.test(id) || /^rank\d{3}$/.test(id))) throw new Error('Candidate IDs must be valid and unique');
  const runName = values.name ?? (command === 'calibrate' ? 'calibration' : (ids.length ? `tournament-${ids.join('-')}` : 'tournament-initial'));
  if (!/^[a-z][a-z0-9-]{0,179}$/.test(runName)) throw new Error('Invalid or too long result name; use --name ID');
  if (dry && values.resume) throw new Error('--dry-run and --resume cannot be combined');
  const previous = values.resume ? JSON.parse(await readFile(join(resultsDir, `${runName}.json`), 'utf8')) : null;
  if (previous && !['blocked', 'in-progress'].includes(previous.status)) throw new Error('Only an unfinished run can be resumed');
  const candidatePosted = previous?.candidatePosted ?? (process.env.CANDIDATE_POSTED || new Date().toISOString());
  if (!dry && command === 'tournament') {
    const recorded = await readFile(join(resultsDir, 'calibration.json'), 'utf8').then(JSON.parse).catch(() => null);
    if (recorded?.status !== 'complete' || !recorded?.calibrationPassed) throw new Error('Run and pass calibrate before collecting tournament scores');
  }
  const pairs = command === 'calibrate' ? calibration : eligible.flatMap((id) => opponents.map((r) => [id, r]));
  const entries = await entriesFor(new Set(pairs.flat()), candidatePosted);
  const rubric = extractRubric(await readFile(rulesPath, 'utf8'));
  const system = `${rubric}\n\n${format}`;
  const groups = pairs.map(([player, opponent], pair) => pairOrders(player, opponent, pair, games));
  const jobs = groups.flat();
  const config = { model, reasoningEffort: 'high', maxTokens: 1400, concurrency, gamesPerPair: games, candidatePosted, rubricSha256: digest(rubric), systemSha256: digest(system),
    candidates: command === 'calibrate' ? calibration.map(([a]) => a) : eligible,
    entries: Object.fromEntries([...entries].map(([id, entry]) => [id, entry.info])), orderedCalls: jobs.length };
  if (dry) {
    const prepared = jobs.map((job) => {
      const req = requestFor(system, entries.get(job.A), entries.get(job.B), 0);
      return { ...job, requestSha256: digest(JSON.stringify(req)), partTypes: req.messages[1].content.map((part) => part.type) };
    });
    await save(`${runName}-plan`, { ...config, status: 'dry-run', matchesScored: 0,
      pairs: [...new Set(pairs.map((pair) => pair.join(' vs ')))],
      requestTypes: prepared[0].partTypes, orderedRequestManifestSha256: digest(JSON.stringify(prepared)) });
    console.log(`${runName}: verified ${entries.size} entries and built ${jobs.length} ordered requests; no API calls made`);
    return;
  }
  const callId = ({ pair, game, A }) => `${pair}/${game}/${A}`;
  const jobIds = new Set(jobs.map(callId));
  const priorCalls = new Map();
  const interruptions = [...(previous?.interruptions ?? [])];
  if (previous) {
    for (const key of ['model', 'gamesPerPair', 'systemSha256', 'entries', 'orderedCalls']) {
      if (JSON.stringify(config[key]) !== JSON.stringify(previous[key])) throw new Error(`Cannot resume: ${key} changed`);
    }
    for (const call of previous.calls) {
      if (!jobIds.has(callId(call)) || priorCalls.has(callId(call))) throw new Error('Cannot resume: invalid checkpoint call');
      if (call.fatal) interruptions.push(call);
      else priorCalls.set(callId(call), call);
    }
  }
  const byPair = groups.map(() => []);
  const snapshotCalls = () => jobs.flatMap((job) => {
    const call = priorCalls.get(callId(job)) ?? byPair[job.pair].find((item) => callId(item) === callId(job));
    return call ? [call] : [];
  });
  let nextPair = 0;
  let fatal;
  let checkpoint = Promise.resolve();
  await Promise.all(Array.from({ length: Math.min(concurrency, groups.length) }, async () => {
    while (!fatal && nextPair < groups.length) {
      const pair = nextPair++;
      if (groups[pair].every((job) => priorCalls.has(callId(job)))) continue;
      for (const job of groups[pair]) {
        if (fatal) break;
        if (priorCalls.has(callId(job))) continue;
        const result = await callJudge(system, entries.get(job.A), entries.get(job.B));
        byPair[pair].push({ ...job, ...result, score: result.fatal ? null : scoreFor(result.verdict, job.A === job.player ? 'A' : 'B') });
        fatal ??= result.fatal;
        if (job.B === job.player || fatal) {
          checkpoint = checkpoint.then(async () => {
            const calls = snapshotCalls();
            await save(runName, { ...config, status: fatal ? 'blocked' : 'in-progress', interruptions, calls });
          });
          await checkpoint;
        }
      }
      const snapshot = snapshotCalls();
      console.log(`${runName}: ${snapshot.length}/${jobs.length} calls; ${snapshot.filter((x) => x.verdict).length} verdicts`);
    }
  }));
  const calls = snapshotCalls();
  if (fatal) {
    await save(runName, { ...config, status: 'blocked', interruptions, calls });
    throw new Error(fatal);
  }
  const results = command === 'calibrate' ? calibration.map(([a, b]) => ({ candidate: a, opponent: b, ...rowMetrics(calls, a, b) })) : tournamentMetrics(calls, eligible);
  const calibrationPassed = command === 'calibrate' ? results[0].wins > games && results[1].verdicts - results[1].wins > games && results[0].score > .5 && results[1].score < .5 : undefined;
  await save(runName, { ...config, status: 'complete', calibrationPassed, interruptions, results, calls });
  if (command === 'calibrate') {
    console.table(results);
    if (!calibrationPassed) throw new Error('Calibration did not recover the expected ordering on a majority of ordered calls');
  } else printTable(calls, eligible);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
