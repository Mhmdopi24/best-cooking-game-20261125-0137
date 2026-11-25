# Sizzle & Skillet

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Mhmdopi24/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Mhmdopi24/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

An original tiny diner rush game, entered in make.fun's
[Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137)
bounty. Everything is drawn in code on a canvas — the kitchen, the food, the
customers' faces — and every sound is synthesized with WebAudio. No image
files, no audio files, no network requests: just static files under `game/`.

## How to play

Tickets pin to the order board, each wanting its dish stacked **bottom to
top**, exactly as the little picture on the ticket shows. Click an
ingredient bin (or press its number key):

- Fresh food — buns, cheese, lettuce, tomato — lands straight on the plate.
- Raw food — beef patties, eggs, bacon — goes onto the grill. Click its
  grill slot while the doneness bar is in the **gold window** to plate it
  perfectly; leave it too long and it burns.

Hit **SERVE** (or Space) when the plate matches a ticket. Tips grow with
the customer's remaining patience, with perfect cooking, and with your
combo. Let a patience bar empty and the customer walks out: the combo and
$3 are gone. One day lasts 2 minutes 30 seconds — fill the till.

Click the plate itself to take the top layer back off; **X** scraps the
whole plate.

## Layout of the entry

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
- `game/index.html` — the page; `game/src/` holds the game, one job per
  file: `recipes.js` (menu data), `orders.js` (the ticket board),
  `grill.js` (cooking), `art.js` (all drawing), `audio.js` (synthesized
  sounds), `game.js` (the day loop, input, HUD and screens), `shots.js`
  (the staged `?shot=` scenes the screenshots were taken from) and
  `main.js` (bootstrap).
- `screenshots/` — four renders of the game itself, taken from the
  `?shot=` scenes listed in `shots.json`.
- `serve.ts` — a small static server for playing locally:
  `node serve.ts` then open http://localhost:8090.

## License

MIT — see `LICENSE`.
