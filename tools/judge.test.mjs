import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { callJudge, dossierText, extractRubric, model, pairOrders, parseVerdict, ranks, requestFor, scoreFor, tournamentMetrics } from './judge.mjs';

const finished = (content, finish_reason = 'stop') => ({ choices: [{ finish_reason, message: { content } }] });

test('accepts fenced reasoning and picks only the declared winner', () => {
  const answer = '<think>{"winner":"A"}</think>\n```json\n{"reason":"B is sharper","winner":" b ","margin":"2"}\n```';
  assert.deepEqual(parseVerdict(finished(answer)), { reason: 'B is sharper', winner: 'B', margin: 2 });
  assert.equal(parseVerdict(finished(answer, 'length')), null);
  for (const margin of [0, 6, 2.5, true, null]) assert.equal(parseVerdict(finished(JSON.stringify({ reason: 'x', winner: 'A', margin }))), null);
});

test('reads retry tool arguments and scores both orientations', () => {
  const answer = { choices: [{ finish_reason: 'tool_calls', message: { content: null, tool_calls: [{ function: { name: 'verdict', arguments: '{"reason":"One beat lands","winner":"A","margin":5}' } }] } }] };
  const verdict = parseVerdict(answer);
  assert.equal(scoreFor(verdict, 'A'), 1);
  assert.equal(scoreFor(verdict, 'B'), 0);
  assert.equal(scoreFor({ winner: 'B', margin: 1 }, 'A'), .4);
  assert.equal(scoreFor(null, 'A'), .5);
});

test('reads the rules verbatim and orders images before post text', async () => {
  const original = await readFile(process.env.MAKEFUN_RULES || new URL('../../gta6-meme-x-01-kit/RULES.txt', import.meta.url), 'utf8');
  const prompt = extractRubric(original);
  assert.equal(prompt.split('\n').filter((line) => /^\d\./.test(line)).length, 7);
  assert.equal(original.replaceAll('\r\n', '\n').includes(prompt), true);
  const a = { jpeg: Buffer.from([255, 216, 255]), handle: 'alpha', posted: '2026-11-21', text: 'One line\nAnother line' };
  const b = { ...a, handle: 'beta' };
  assert.equal(dossierText(a), 'A post on X\nAuthor: @alpha\nPosted: 2026-11-21\nText:\nOne line\nAnother line');
  const req = requestFor(prompt, a, b, 0);
  assert.equal(req.max_tokens, 1400);
  assert.equal(req.reasoning.effort, 'high');
  const parts = req.messages[1].content;
  assert.deepEqual(parts.map((p) => p.type), ['text','image_url','text','text','image_url','text','text']);
  assert.match(parts[2].text, /Author: @alpha/);
  assert.match(parts[5].text, /Author: @beta/);
  assert.equal(requestFor(prompt, b, a, 1).tool_choice.function.name, 'verdict');
  assert.equal(Buffer.byteLength(dossierText({ ...a, text: '0123456789\nä'.repeat(200) })) <= 1248, true);
});

test('schedules three games with both orders and reports the two means', () => {
  const jobs = pairOrders('funeral', 'rank007', 2, 3);
  assert.deepEqual(jobs.map(({ game, A }) => [game, A]), [
    [1, 'funeral'], [1, 'rank007'], [2, 'funeral'], [2, 'rank007'], [3, 'funeral'], [3, 'rank007']
  ]);
  const calls = ranks.flatMap((rank, pair) => {
    const id = `rank${String(rank).padStart(3, '0')}`;
    return pairOrders('funeral', id, pair, 3).map((job) => ({ ...job, verdict: { margin: 2 }, score: rank <= 10 ? 0.7 : 0.4 }));
  });
  const [row] = tournamentMetrics(calls, ['funeral']);
  assert.equal(row.games.rank007.calls, 6);
  assert.equal(row.games.rank007.wins, 6);
  assert.ok(Math.abs(row.games.rank100.score - 0.4) < 1e-9);
  assert.ok(Math.abs(row.top10Mean - 0.7) < 1e-9);
  assert.ok(Math.abs(row.mean - 0.6) < 1e-9);
  assert.equal(tournamentMetrics(calls.slice(0, -6), ['funeral'])[0].mean, null);
});

test('POSTs to JUDGE_URL without Authorization and pins the model', async (t) => {
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    requests.push([req.url, req.method, req.headers.authorization, JSON.parse(Buffer.concat(chunks)).model]);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ model, ...finished('{"reason":"test","winner":"A","margin":1}') }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const original = process.env.JUDGE_URL;
  t.after(() => {
    if (original === undefined) delete process.env.JUDGE_URL;
    else process.env.JUDGE_URL = original;
    return new Promise((resolve) => server.close(resolve));
  });
  process.env.JUDGE_URL = `http://127.0.0.1:${server.address().port}/test`;
  const entry = { jpeg: Buffer.from([255, 216, 255]), handle: 'test', posted: '2026-11-21', text: 'test' };
  assert.equal((await callJudge('test', entry, entry)).verdict?.winner, 'A');
  assert.deepEqual(requests, [['/test', 'POST', undefined, model]]);
});
