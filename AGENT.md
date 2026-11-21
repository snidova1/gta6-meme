# Entry handoff

The replacement artwork and copy are in `meme.png` and `post.txt`. `POST.json` still names the earlier post. Keep it unchanged until the owner supplies the replacement public X status URL.

`main.ts` is the offline grading entrypoint. The browser renderer and optional model comparisons live in `tools/` and are not loaded by the grader. Preserve the recorded build session as the authorship record.
