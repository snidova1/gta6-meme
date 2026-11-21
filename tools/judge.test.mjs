import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { dossierText, extractRubric, parseVerdict, requestFor, scoreFor } from './judge.mjs';

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
