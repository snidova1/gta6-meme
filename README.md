# R.I.P. GTA V

[![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![Rank](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard)
[![Reward](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/reward.svg)](https://make.fun/bounty/gta6-meme-x-01)

A Vice City funeral home lays GTA V to rest after 13 years. The cause of death is GTA 6, the wake has already been moved twice, and the make.fun ghost stamps the bill paid with its bounty cash. The illustration is original SVG; the [make.fun press mark](https://make.fun/press/mark-1024.png) was used as a character reference, not embedded.

![A Vice City obituary for GTA V. A bow-tied make.fun ghost holds its magenta star coin and stamps a receipt beside an open coffin.](meme.png)

## Run the grader entrypoint

With Node.js 22.18 or later, from the repository root:

```sh
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies the original bytes of `POST.json` to `out/POST.json`. `POST.json` still points to the earlier entry. Nothing in this repository posts to X or submits to make.fun. After posting the replacement, update the pointer with the new public status URL before entering it.

## Rebuild the art

```sh
node tools/render.mjs
node tools/render.mjs --select funeral-r3
```

The Windows defaults point to Chrome and the local `puppeteer-core` installation. Override them with `CHROME_PATH` and `PUPPETEER_CORE`. The renderer produces the seven 1200 × 1200 candidates and their copy in `candidates/`, and SVGs and 480 × 480 JPEG previews in `out/`. The ten starting concepts are in [candidates/concepts.md](candidates/concepts.md).

## Run the judge

`tools/judge.mjs` reads the verbatim rubric from the adjacent kit and the public comparison data from the adjacent `meme-ref` directory. Override the paths with `MAKEFUN_RULES` and `MEME_REF_DIR`. The reference timestamps come from their X post IDs. New drafts use the previous post's handle and an estimated posting time; neither is part of the rubric. The preview reproduces the documented JPEG dimensions and black transparency fill, not the house's exact encoder or provider routing.

With `OPENROUTER_API_KEY` available in the process environment:

```sh
node --test tools/judge.test.mjs
node tools/judge.mjs calibrate
node tools/judge.mjs tournament
node tools/judge.mjs tournament funeral-r1 funeral-r2 funeral-r3
node tools/judge.mjs report tournament-initial tournament-funeral-r1-funeral-r2-funeral-r3
```

Calibration compares #1 with #800 and #869 with #100, six two-order games per pair. Each tournament candidate faces #1, #2, #3, #5, #7, #10, #20, #50, and #100 in both orders. The `Top 10` column averages the six sampled top-ten rivals. Result files distinguish model verdicts, missing verdicts, and blocked requests. `--dry-run` builds and checks requests without sending them.

**Build status:** All seven designs were reviewed at 480 px. The live calibration was blocked because the key was absent from the session environment. The JSON in `judge-results/` records the blocker and dry-run coverage, not model scores. `funeral-r3` is the editorial pick: a shorter headline, explicit receipt-stamping, and a punch line in the post that adds a joke instead of repeating the image.
