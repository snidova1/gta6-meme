# R.I.P. GTA V

[![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![Rank](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard)
[![Reward](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/reward.svg)](https://make.fun/bounty/gta6-meme-x-01)

A Vice City funeral home lays GTA V to rest after 13 years. Jason and Lucia inherit the SSD, and the make.fun ghost stamps the $79.99 burial bill paid with real bounty money earned by the author's AI agent. The illustration is original SVG; the [make.fun press mark](https://make.fun/press/mark-1024.png) was used as a character reference, not embedded.

The selected candidate is `funeral-heirs`, saved as `meme.png` and [posted on X](https://x.com/if1ndretard/status/2124090076472999953).

![A Vice City obituary for GTA V. A bow-tied make.fun ghost stamps a burial bill PAID next to a mourning alligator and an open coffin.](meme.png)

## Run the grader entrypoint

With Node.js 22.18 or later, from the repository root:

```sh
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `POST.json`, which points to the live X post above, byte for byte to `out/POST.json`. The `out/` directory is gitignored. Nothing in this repository posts to X or submits to make.fun.

## Rebuild the art

```sh
node tools/render.mjs
node tools/render.mjs --select funeral-heirs
```

The Windows defaults point to Chrome and the local `puppeteer-core` installation. Override them with `CHROME_PATH` and `PUPPETEER_CORE`. The renderer writes 1200 × 1200 candidates and their copy to `candidates/`, and SVGs and 480 × 480 JPEG previews to `out/`. It checks the effective font size at 480 px, including text inside scaled SVG groups. `--select` copies the reviewed bytes to `meme.png` and `post.txt` without rerendering. The [design notes](candidates/review.md) record the visual review, including both improvement rounds.

## Run the judge

`tools/judge.mjs` reads the verbatim rubric from the adjacent kit and the public comparison data from the adjacent `meme-ref` directory. Override the paths with `MAKEFUN_RULES` and `MEME_REF_DIR`. The reference timestamps come from their X post IDs. New drafts use the previous post's handle and an estimated posting time; neither is part of the rubric. The preview reproduces the documented JPEG dimensions and black transparency fill, not the house's exact encoder or provider routing.

Run the local judge proxy first. The runner reads the full completions endpoint from `JUDGE_URL`, defaulting to `http://127.0.0.1:8788/api/v1/chat/completions`. It sends only `z-ai/glm-5.3-flash` and never reads a key or sends an Authorization header. The proxy handles authentication.

```sh
node --test tools/judge.test.mjs
node tools/judge.mjs calibrate --name proxy-calibration-check
node tools/judge.mjs report --partial tournament-launch
```

Calibration defaults to six two-order games per pair, comparing #1 with #800 and #869 with #100. A live tournament requires a passing `calibration.json`, which is included here. `--games 3` means three games against each of #1, #2, #3, #5, #7, #10, #20, #50, and #100, with a call in each order per game. `Top 10` averages the six sampled top-ten rivals; `All` averages all nine reference means. Use `--name` to preserve existing runs and `--dry-run` to check requests without sending any. HTTP failures that block a run are not scored as ties.

## Results and selection

The [live proxy calibration](judge-results/proxy-calibration.json) passed: #1 won 6/6 calls against #800, and #869 lost 6/6 against #100. The earlier one-game [baseline](judge-results/tournament-initial.json) and [funeral revisions](judge-results/tournament-funeral-r1-funeral-r2-funeral-r3.json) are retained separately. The new [three-game tournament](judge-results/tournament-launch.json) stopped after 239 of 702 ordered calls could be recorded without a blocking error. The proxy repeatedly returned HTTP 402; the latest failures indicated credits or balance. Only fully played pairs are shown here.

| Candidate | #1 | #2 | #3 | #5 | #7 | #10 | #20 | #50 | #100 | Top 10 | All |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| funeral-heirs | 0.617 | 0.683 | 0.683 | 0.700 | 0.383 | 0.683 | 0.600 | 0.733 | 0.533 | 0.625 | 0.624 |
| funeral-wake | 0.633 | 0.650 | 0.633 | 0.617 | 0.433 | 0.683 | 0.650 | 0.700 | 0.667 | 0.608 | 0.630 |
| funeral-sick | 0.450 | 0.600 | 0.600 | 0.550 | 0.350 | 0.683 | 0.517 | 0.667 | 0.700 | 0.539 | 0.569 |
| funeral-estate | 0.517 | 0.700 | 0.650 | 0.667 | 0.533 | — | — | — | — | — | — |

`funeral-heirs` was selected for the live post because it had the highest complete top-ten mean, even though it did not beat #7. `funeral-estate` beat #7 over three games but did not complete the top-ten slate. The navigation concept received 28 ordered calls but completed no three-game pair; the divorce decree and both follow-up rounds have no live scores. Both improvement rounds were rendered, reviewed at 480 px, and checked with dry runs.

When the proxy can accept the requests, resume without replaying the recorded calls, then run the two improvement rounds:

```sh
node tools/judge.mjs tournament --resume --games 3 --name tournament-launch funeral-heirs funeral-wake funeral-sick funeral-estate route-map custody funeral funeral-r1 funeral-r2 funeral-r3 office eviction fraud
node tools/judge.mjs tournament --games 3 --name tournament-improve-1 funeral-heirs-v2 funeral-wake-v2
node tools/judge.mjs tournament --games 3 --name tournament-improve-2 funeral-heirs-v3 funeral-wake-v3
node tools/judge.mjs report tournament-launch tournament-improve-1 tournament-improve-2
```
