# Entry handoff

The artwork and X copy are ready to review in `meme.png` and `post.txt`. This repository does not publish anything. Keep the placeholder in `POST.json` until the owner supplies the public X status URL.

`main.ts` is the offline grading entrypoint; keep drawing and screenshot tooling in `render.mjs` rather than introducing browser dependencies into the grader. Preserve the original agent session as the record of how the entry was made.
