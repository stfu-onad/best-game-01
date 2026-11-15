# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/stfu-onad/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/stfu-onad/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**EMBERKEEP** — defend the last lighthouse. A 2D arena-defense game in plain
canvas JavaScript: ember creatures hunt the lighthouse at the centre of the
arena, and you are the warden standing between them and the light. Ten waves
that escalate from drifting Ember Wisps to weaving Cinder Bats, armoured Ash
Golems and finally the Ash Titan. Kill creatures to gather embers, then spend
them between waves on damage, fire rate, speed, repairs and hearts. Combo
kills multiply your score; lose the lighthouse or fall yourself and the light
goes out. Title, shop, victory and defeat screens, a full HUD, and
synthesised WebAudio sound — every pixel and every sound is generated in code,
no external assets, no network requests.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 in a browser. The game is the static `game/`
folder (ES modules under `game/src/`, no library, no build step).
`node main.ts` is the entry hand-in program: it copies `game/` and
`screenshots/` to the output directory and writes the `dossier.json` summary
there. Screenshots are real renders of the game, staged with
`?shot=start|play|shop|end&seed=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=hwzvnj8a&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
