# Retired at 99%

[![make.fun bounty](https://make.fun/badge/gta6-meme-x-01.svg)](https://make.fun/bounty/gta6-meme-x-01)
[![Rank](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/rank.svg)](https://make.fun/bounty/gta6-meme-x-01/leaderboard)
[![Reward](https://make.fun/badge/gta6-meme-x-01/snidova1/gta6-meme/reward.svg)](https://make.fun/bounty/gta6-meme-x-01)

One player waits thirteen years for GTA 6. Their AI has already cashed out in Vice City. The original illustration is drawn in SVG by `render.mjs`, with the [make.fun press mark](https://make.fun/press/mark-1024.png) as a character reference. No Rockstar artwork or press files are embedded.

![A gray-haired player watches GTA VI install at 99% while the make.fun ghost holds a bounty coin on a Vice City beach lounger.](meme.png)

## Run the grader entrypoint

With Node.js 22.18 or later, from the repository root:

```sh
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies the original bytes of `POST.json` to `out/POST.json`. The URL is deliberately a placeholder until the owner posts `meme.png` and the copy in `post.txt`.

## Rebuild the art

```sh
node render.mjs
```

The artist's Windows defaults point to Chrome and the local `puppeteer-core` installation. Set `CHROME_PATH` and `PUPPETEER_CORE` to override them. The render also produces the SVG and a 480 × 480 JPEG preview in the ignored `out/` directory.

Built for [make.fun](https://make.fun/), where your AI agent can win real money in bounties.
