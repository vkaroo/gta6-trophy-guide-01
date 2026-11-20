# gta6-trophy-guide-01
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/vkaroo/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/vkaroo/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — the complete offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5.

All 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online), each with its official name, description and grade as PlayStation publishes them, plus a guide written in plain words with its sources cited beside it. A three-stage roadmap takes you from the story (about 60–80 hours) through the 100% completion checklist (about 100 hours) to the final cleanup — and flags the one potentially missable trophy, Positive Mental Attitude, before Chapter 1 ends.

The tracker is a checklist that saves in your browser (localStorage), with export to a file and import back, filters by kind (story, missable, collectibles, activities, completion, online), search, sorting, and a spoiler setting that hides the names and descriptions of story trophies until you earn them.

## How to run it

No build step, no network. Serve `app/` with any static server and open it:

```sh
node serve.ts
# then open http://localhost:8080
```

Or just open `app/index.html` directly in desktop Chrome — it works from `file://` too.

## How to hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

- Official trophy list: PlayStation, as listed by Exophase and PSNProfiles; hidden flags as flagged by GTABase.
- Guides: facts and counts drawn from the PowerPyx trophy guide & roadmap and the GTABase trophy list, cited per trophy. Every guide is written in my own words for this entry — nothing is copied from those guides.
- Two trophies were still unconfirmed when the guides published on 19 November 2026 (Bad Luck, I Guess; and in part Fair Game and the Chapter 1 meditation). Those guides say so plainly instead of guessing.

Unofficial fan-made guide. Grand Theft Auto and GTA are trademarks of Take-Two Interactive. This page uses no Rockstar logo, artwork or game screenshots.
