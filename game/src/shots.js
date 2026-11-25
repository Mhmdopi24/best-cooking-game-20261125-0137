// shots.js — the screenshot scenes. Open the game with ?shot=<name> and it
// stages a real, frozen moment of play with the game's own state and
// renderer: nothing here draws anything, it only deals tickets, stacks the
// plate and loads the grill exactly as a player's clicks would, then stops
// the clock. The maker's screenshots are renders of these scenes.

import { DISHES, INGREDIENTS } from './recipes.js';
import { OrderTicket } from './orders.js';
import { mulberry32 } from './game.js';

export function readShotRequest() {
  return new URLSearchParams(window.location.search).get('shot');
}

function addTicket(game, dishName, patienceFraction) {
  const dish = DISHES.find((d) => d.name === dishName);
  const ticket = new OrderTicket(dish, 0.3, game.board.rng);
  ticket.patience = ticket.patienceMax * patienceFraction;
  game.board.tickets.push(ticket);
  return ticket;
}

function loadGrillSlot(game, index, ingredientId, progress) {
  const slot = game.grill.slots[index];
  slot.place(ingredientId);
  slot.elapsed = INGREDIENTS[ingredientId].cookSeconds * progress;
  slot.dinged = progress >= 0.65;
}

function stack(game, items) {
  game.plate = items.map(([id, quality]) => ({ id, quality }));
}

// Every scene: a believable mid-rush diner — tickets up, food on the grill,
// the till filling, the day clock well into the morning.
const SCENES = {
  // The cover: the fullest moment. Three tickets, a Classic Stack one layer
  // from done, a patty in its golden window, bacon just on the grill.
  cover(game) {
    game.dayElapsed = 68;
    game.coins = 86;
    game.servedCount = 7;
    game.combo = 4;
    game.bestCombo = 5;
    addTicket(game, 'Classic Stack', 0.8);
    addTicket(game, 'Sunrise Stack', 0.45);
    addTicket(game, 'Double Trouble', 0.62);
    stack(game, [['bunBase', 'fresh'], ['patty', 'perfect'], ['cheese', 'fresh']]);
    loadGrillSlot(game, 0, 'patty', 0.82);
    loadGrillSlot(game, 1, 'bacon', 0.4);
    game.lastServed = { name: 'Garden Stack', payout: 17, timer: 9999 };
  },
  // Mid-assembly: a Garden Stack half-built, an egg frying for the next one.
  assembly(game) {
    game.dayElapsed = 40;
    game.coins = 38;
    game.servedCount = 3;
    game.combo = 2;
    game.bestCombo = 3;
    addTicket(game, 'Garden Stack', 0.7);
    addTicket(game, 'Classic Stack', 0.9);
    stack(game, [['bunBase', 'fresh'], ['patty', 'perfect'], ['lettuce', 'fresh']]);
    loadGrillSlot(game, 0, 'egg', 0.5);
    loadGrillSlot(game, 2, 'patty', 0.25);
  },
  // The grill at full stretch: three slots in three different bands.
  grill(game) {
    game.dayElapsed = 95;
    game.coins = 112;
    game.servedCount = 9;
    game.combo = 6;
    game.bestCombo = 6;
    addTicket(game, 'Farmhouse Stack', 0.5);
    addTicket(game, 'Bacon Crunch', 0.75);
    stack(game, [['bunBase', 'fresh'], ['bacon', 'perfect']]);
    loadGrillSlot(game, 0, 'patty', 0.85);
    loadGrillSlot(game, 1, 'bacon', 0.7);
    loadGrillSlot(game, 2, 'egg', 1.1);
  },
  // Ready to serve: a finished Classic Stack on the plate, its ticket
  // waiting, the day nearly done and a Sunrise customer nearly out of time.
  serve(game) {
    game.dayElapsed = 120;
    game.coins = 141;
    game.servedCount = 11;
    game.combo = 7;
    game.bestCombo = 7;
    addTicket(game, 'Classic Stack', 0.65);
    addTicket(game, 'Sunrise Stack', 0.35);
    stack(game, [['bunBase', 'fresh'], ['patty', 'perfect'], ['cheese', 'fresh'], ['bunTop', 'fresh']]);
    loadGrillSlot(game, 0, 'egg', 0.8);
  },
};

export function stageShot(game, name) {
  const scene = SCENES[name] || SCENES.cover;
  game.resetDay();
  game.board.rng = mulberry32(20261125);
  game.screen = 'play';
  game.frozen = true;
  scene(game);
}
