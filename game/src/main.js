// main.js — bootstrap: find the canvas, build the Game, wire the mouse and
// keyboard to it, fit it to the window, and run the frame loop. If the URL
// carries ?shot=<name>, shots.js stages that frozen scene instead of the
// title screen, so the maker can screenshot the game being itself.

import { Game, VIEW_W, VIEW_H } from './game.js';
import { readShotRequest, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = new Game(canvas);

const shot = readShotRequest();
if (shot) stageShot(game, shot);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

canvas.addEventListener('pointermove', (event) => game.onPointerMove(event));
canvas.addEventListener('pointerdown', (event) => game.onPointerDown(event));
window.addEventListener('keydown', (event) => game.onKeyDown(event));

let last = performance.now();
let statusClock = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render();
  statusClock += dt;
  if (status && statusClock > 1) {
    statusClock = 0;
    status.textContent = game.screen === 'play'
      ? `Day in progress. $${game.coins} in the till, ${game.servedCount} dishes served, ${game.board.openCount} orders waiting.`
      : game.screen === 'end'
        ? `Day complete. $${game.coins} earned, ${game.servedCount} dishes served.`
        : 'Sizzle & Skillet. Click to open the diner.';
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
