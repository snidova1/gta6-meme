import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const localRoot = fileURLToPath(new URL('./', import.meta.url));
const entryRoot = process.env.MAKEFUN_BOT_DIR || localRoot;
const artifactRoot = process.env.MAKEFUN_OUTPUT_DIR || '/output';
// The only grading output is the original X post pointer. Art and judging tools run separately.
const entryPointer = 'POST.json';
const envelope = await readFile(join(entryRoot, entryPointer));
await mkdir(artifactRoot, { recursive: true });
await writeFile(join(artifactRoot, entryPointer), envelope);
