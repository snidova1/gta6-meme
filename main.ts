import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const checkout = process.env.MAKEFUN_BOT_DIR ?? fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const postName = 'POST.json';
const sourcePost = resolve(checkout, postName);
const outputPost = resolve(destination, postName);

// Preserve the exact checked-in bytes; the house reads the post itself from X.
mkdirSync(destination, { recursive: true });
copyFileSync(sourcePost, outputPost);
