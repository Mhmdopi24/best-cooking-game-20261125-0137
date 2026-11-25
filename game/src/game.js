// game.js — Sizzle & Skillet itself: the day loop, the plate, the scoring,
// the input, the HUD and the title and day-end screens. Drawing of food and
// furniture lives in art.js; the tickets live in orders.js; the cooking in
// grill.js; the sounds in audio.js. This file conducts them.

import { BIN_ORDER, INGREDIENTS } from './recipes.js';
import { OrderBoard } from './orders.js';
import { Grill } from './grill.js';
import { SoundKitchen } from './audio.js';
import {
  drawKitchenBackdrop, drawChalkboard, drawTicket, drawBin, drawPlate,
  drawPlateStack, drawIngredient, drawCoin, drawSteamPuff, rr, text,
} from './art.js';
import { DISHES } from './recipes.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const DAY_LENGTH = 150;

// The fixed furniture of the diner, in logical pixels. shots.js stages its
// scenes against these same numbers.
export const LAYOUT = {
  ticketX: (i) => 20 + i * 220,
  ticketY: 78,
  ticketW: 204,
  ticketH: 168,
  boardX: 916,
  boardY: 70,
  boardW: 344,
  boardH: 176,
  binY: 446,
  binW: 148,
  binH: 84,
  binX: (i) => 18 + i * 156.57,
  plateCx: 245,
  plateY: 672,
  plateW: 310,
  grillX: 486,
  grillY: 552,
  grillW: 464,
  grillH: 196,
  slotX: (i) => 502 + i * 148,
  slotY: 572,
  slotW: 136,
  slotH: 122,
  serveRect: { x: 966, y: 552, w: 294, h: 84 },
  trashRect: { x: 966, y: 652, w: 294, h: 60 },
  passRect: { x: 966, y: 728, w: 294, h: 58 },
};

// A small deterministic RNG (mulberry32): order flow is seeded, so a staged
// screenshot and a replayed day deal the same tickets.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new SoundKitchen();
    this.rng = mulberry32((Date.now() % 2147483647) || 7);
    this.board = new OrderBoard(this.rng);
    this.grill = new Grill();
    this.screen = 'title';
    this.time = 0; // the visual clock: never stops, drives steam and sway
    this.frozen = false; // shot mode: render a staged scene, never update it
    this.hover = null;
    this.plate = [];
    this.plateBounce = 0;
    this.plateShake = 0;
    this.slotShake = new Map();
    this.particles = [];
    this.floaters = [];
    this.hint = '';
    this.hintUntil = 0;
    this.lastServed = null;
    this.resetDay();
    this.stageTitleScene();
  }

  resetDay() {
    this.dayElapsed = 0;
    this.coins = 0;
    this.servedCount = 0;
    this.perfectCooks = 0;
    this.walkouts = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.strikes = 0;
    this.plate = [];
    this.lastServed = null;
    this.board.clear();
    this.grill.clear();
  }

  get dayProgress() {
    return Math.min(1, this.dayElapsed / DAY_LENGTH);
  }

  get dayLeft() {
    return Math.max(0, DAY_LENGTH - this.dayElapsed);
  }

  // The scene behind the title: a diner already mid-morning, frozen.
  stageTitleScene() {
    const rng = mulberry32(20261125);
    this.board.rng = rng;
    const first = this.board.spawn(10, 0.1);
    first.patience = first.patienceMax * 0.8;
    const second = this.board.spawn(40, 0.2);
    second.patience = second.patienceMax * 0.55;
    this.plate = [
      { id: 'bunBase', quality: 'fresh' },
      { id: 'patty', quality: 'perfect' },
      { id: 'cheese', quality: 'fresh' },
    ];
    const slot = this.grill.slots[0];
    slot.place('patty');
    slot.elapsed = INGREDIENTS.patty.cookSeconds * 0.8;
    this.board.rng = this.rng;
  }

  startDay() {
    this.resetDay();
    this.rng = mulberry32((Date.now() % 2147483647) || 11);
    this.board.rng = this.rng;
    this.screen = 'play';
    const first = this.board.spawn(0, 0);
    first.patience = first.patienceMax;
    this.board.spawnTimer = 6.5;
    this.say('First order up! Grill the patty, stack the ticket, hit SERVE.');
  }

  endDay() {
    this.screen = 'end';
  }

  get stars() {
    if (this.coins >= 160) return 3;
    if (this.coins >= 100) return 2;
    if (this.coins >= 45) return 1;
    return 0;
  }

  say(message, seconds = 3.2) {
    this.hint = message;
    this.hintUntil = this.time + seconds;
  }

  // ------------------------------------------------------------ actions ----

  clickBin(id) {
    if (INGREDIENTS[id].cookSeconds > 0) {
      if (this.grill.place(id)) {
        this.sound.sizzle();
        const slot = this.grill.slots.find((s) => s.ingredientId === id && s.elapsed === 0);
        if (slot) this.burst(slotCenterX(this.grill.slots.indexOf(slot)), LAYOUT.slotY + 60, 5, 'steam');
      } else {
        this.sound.buzz();
        this.say('The grill is full — serve or toss something first.');
      }
      return;
    }
    if (this.plate.length >= 8) {
      this.sound.buzz();
      this.say('That plate cannot hold another layer. Serve it or trash it.');
      return;
    }
    this.plate.push({ id, quality: 'fresh' });
    this.plateBounce = 1;
    this.sound.pop();
  }

  clickSlot(index) {
    const slot = this.grill.slots[index];
    if (!slot.busy) return;
    const state = slot.state;
    if (state === 'raw') {
      this.slotShake.set(index, 1);
      this.sound.buzz();
      this.say('Still raw! Wait for the golden window on the bar.');
      return;
    }
    const id = slot.ingredientId;
    if (state === 'burnt') {
      slot.clear();
      this.sound.thud();
      this.burst(slotCenterX(index), LAYOUT.slotY + 50, 8, 'smoke');
      this.say('Burnt to a crisp — tossed in the bin.');
      return;
    }
    if (this.plate.length >= 8) {
      this.sound.buzz();
      this.say('The plate is full — serve it before adding more.');
      return;
    }
    slot.clear();
    this.plate.push({ id, quality: state });
    if (state === 'perfect') {
      this.perfectCooks++;
      this.addFloater(LAYOUT.plateCx, LAYOUT.plateY - 190, 'PERFECT!', '#58a34c');
    }
    this.plateBounce = 1;
    this.sound.pop();
    this.burst(LAYOUT.plateCx, LAYOUT.plateY - 120, 4, 'steam');
  }

  clickPlate() {
    if (this.plate.length === 0) return;
    const removed = this.plate.pop();
    this.sound.pop();
    this.say(`Took the ${INGREDIENTS[removed.id].name} back off.`);
  }

  clickTrash() {
    if (this.plate.length === 0) return;
    this.plate = [];
    this.sound.thud();
    this.say('Plate scrapped. Fresh start.');
  }

  clickServe() {
    if (this.plate.length === 0) {
      this.say('The plate is empty — stack a ticket first.');
      return;
    }
    const plateIds = this.plate.map((item) => item.id);
    const ticket = this.board.matchFor(plateIds);
    if (!ticket) {
      this.plateShake = 1;
      this.sound.buzz();
      this.say('No ticket matches that stack — check a ticket, bottom to top.');
      return;
    }
    const perfectItems = this.plate.filter((item) => item.quality === 'perfect').length;
    const tip = Math.round(4 * ticket.patienceFraction) + perfectItems + Math.floor(this.combo / 3);
    const payout = ticket.dish.price + tip;
    this.coins += payout;
    this.servedCount++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.lastServed = { name: ticket.dish.name, payout, timer: 2.6 };
    this.addFloater(LAYOUT.plateCx, LAYOUT.plateY - 210, `+$${payout}`, '#e8a91c');
    if (perfectItems > 0 && perfectItems === this.plate.filter((i) => INGREDIENTS[i.id].cookSeconds > 0).length) {
      this.addFloater(LAYOUT.plateCx, LAYOUT.plateY - 168, 'ALL PERFECT!', '#58a34c');
    }
    this.burst(LAYOUT.plateCx, LAYOUT.plateY - 90, 12, 'spark');
    this.board.remove(ticket);
    this.plate = [];
    this.sound.serve();
  }

  // -------------------------------------------------------------- input ----

  toLogical(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  hitTest(x, y) {
    for (let i = 0; i < BIN_ORDER.length; i++) {
      if (inRect(x, y, { x: LAYOUT.binX(i), y: LAYOUT.binY, w: LAYOUT.binW, h: LAYOUT.binH })) {
        return { kind: 'bin', id: BIN_ORDER[i] };
      }
    }
    for (let i = 0; i < 3; i++) {
      if (inRect(x, y, { x: LAYOUT.slotX(i), y: LAYOUT.slotY, w: LAYOUT.slotW, h: LAYOUT.slotH })) {
        return { kind: 'slot', index: i };
      }
    }
    if (inRect(x, y, LAYOUT.serveRect)) return { kind: 'serve' };
    if (inRect(x, y, LAYOUT.trashRect)) return { kind: 'trash' };
    const dx = x - LAYOUT.plateCx;
    const dy = (y - LAYOUT.plateY) * 2.4;
    if (dx * dx + dy * dy < 165 * 165) return { kind: 'plate' };
    return null;
  }

  onPointerMove(event) {
    const { x, y } = this.toLogical(event);
    this.hover = this.screen === 'play' ? this.hitTest(x, y) : null;
    this.canvas.style.cursor = this.hover || this.screen !== 'play' ? 'pointer' : 'default';
  }

  onPointerDown(event) {
    this.sound.unlock();
    if (this.screen === 'title') {
      this.startDay();
      return;
    }
    if (this.screen === 'end') {
      this.startDay();
      return;
    }
    const { x, y } = this.toLogical(event);
    const hit = this.hitTest(x, y);
    if (!hit) return;
    if (hit.kind === 'bin') this.clickBin(hit.id);
    else if (hit.kind === 'slot') this.clickSlot(hit.index);
    else if (hit.kind === 'serve') this.clickServe();
    else if (hit.kind === 'trash') this.clickTrash();
    else if (hit.kind === 'plate') this.clickPlate();
  }

  onKeyDown(event) {
    this.sound.unlock();
    if (this.screen !== 'play') {
      if (event.key === ' ' || event.key === 'Enter') this.startDay();
      return;
    }
    const binIndex = ['1', '2', '3', '4', '5', '6', '7', '8'].indexOf(event.key);
    if (binIndex >= 0) this.clickBin(BIN_ORDER[binIndex]);
    else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.clickServe();
    } else if (event.key === 'x' || event.key === 'X' || event.key === 'Backspace') this.clickTrash();
    else if (event.key === 'u' || event.key === 'U') this.clickPlate();
  }

  // ------------------------------------------------------------- update ----

  burst(x, y, count, kind) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (this.rng() - 0.5) * 40,
        y: y + (this.rng() - 0.5) * 10,
        vx: (this.rng() - 0.5) * 22,
        vy: -(24 + this.rng() * 30),
        life: 0,
        maxLife: 0.8 + this.rng() * 0.7,
        size: 5 + this.rng() * 8,
        kind,
      });
    }
  }

  addFloater(x, y, label, color) {
    this.floaters.push({ x, y, label, color, life: 0, maxLife: 1.5 });
  }

  update(dt) {
    this.time += dt;
    // Particles and floaters are pure decoration: they run even on the
    // title screen, and in shot mode the staged scene still breathes.
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 6 * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
    for (const f of this.floaters) f.life += dt;
    this.floaters = this.floaters.filter((f) => f.life < f.maxLife);
    this.plateBounce = Math.max(0, this.plateBounce - dt * 5);
    this.plateShake = Math.max(0, this.plateShake - dt * 3.2);
    for (const [k, v] of this.slotShake) {
      if (v - dt * 3.2 <= 0) this.slotShake.delete(k);
      else this.slotShake.set(k, v - dt * 3.2);
    }
    if (this.lastServed) {
      this.lastServed.timer -= dt;
      if (this.lastServed.timer <= 0) this.lastServed = null;
    }
    if (this.screen !== 'play' || this.frozen) return;

    this.dayElapsed += dt;
    if (this.dayElapsed >= DAY_LENGTH) {
      this.endDay();
      return;
    }
    const walkedOut = this.board.update(dt, this.dayElapsed, this.dayProgress);
    for (const ticket of walkedOut) {
      this.strikes++;
      this.combo = 0;
      this.coins = Math.max(0, this.coins - 3);
      this.walkouts++;
      this.sound.buzz();
      const index = this.board.tickets.indexOf(ticket);
      this.addFloater(LAYOUT.ticketX(Math.max(0, index)) + 100, 150, 'WALKED OUT!', '#d64541');
      this.say('A customer walked out — $3 and your combo are gone.');
    }
    const turnedPerfect = this.grill.update(dt);
    if (turnedPerfect.length > 0) this.sound.ding();
    // Steam rises off anything cooking.
    for (let i = 0; i < 3; i++) {
      const slot = this.grill.slots[i];
      if (slot.busy && this.rng() < dt * 5) {
        this.particles.push({
          x: slotCenterX(i) + (this.rng() - 0.5) * 50,
          y: LAYOUT.slotY + 52,
          vx: (this.rng() - 0.5) * 8,
          vy: -(20 + this.rng() * 16),
          life: 0,
          maxLife: 1 + this.rng() * 0.6,
          size: 4 + this.rng() * 6,
          kind: 'steam',
        });
      }
    }
  }

  // ------------------------------------------------------------- render ----

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawKitchenBackdrop(ctx, VIEW_W, VIEW_H, this.time);
    this.renderBoard(ctx);
    this.renderBins(ctx);
    this.renderStations(ctx);
    this.renderHud(ctx);
    this.renderParticles(ctx);
    if (this.screen === 'title') this.renderTitle(ctx);
    if (this.screen === 'end') this.renderEnd(ctx);
    this.renderHint(ctx);
  }

  renderBoard(ctx) {
    // The rail the tickets hang from.
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(0, 64, VIEW_W, 9);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 64, VIEW_W, 2);
    this.board.tickets.forEach((ticket, i) => {
      ctx.save();
      if (ticket.leaving) {
        ctx.globalAlpha = Math.max(0, 1 - ticket.leaveTimer / 0.9);
        ctx.translate(0, ticket.leaveTimer * 36);
      }
      drawTicket(ctx, ticket, LAYOUT.ticketX(i), LAYOUT.ticketY, LAYOUT.ticketW, LAYOUT.ticketH, this.time);
      ctx.restore();
    });
    drawChalkboard(ctx, LAYOUT.boardX, LAYOUT.boardY, LAYOUT.boardW, LAYOUT.boardH, DISHES);
  }

  renderBins(ctx) {
    BIN_ORDER.forEach((id, i) => {
      const hover = this.hover && this.hover.kind === 'bin' && this.hover.id === id;
      drawBin(ctx, id, LAYOUT.binX(i), LAYOUT.binY, LAYOUT.binW, LAYOUT.binH, String(i + 1), hover, this.time);
    });
  }

  renderStations(ctx) {
    const L = LAYOUT;
    // Assembly mat and plate.
    ctx.fillStyle = 'rgba(240,230,205,0.9)';
    rr(ctx, 58, 548, 374, 208, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,74,38,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'ASSEMBLY', L.plateCx, 570, 14, '#8a6420');
    text(ctx, 'click the plate to take the top layer back', L.plateCx, 590, 10.5, '#a2835c', 'center', 'normal');
    const bounce = Math.sin(this.plateBounce * Math.PI) * 5;
    const shakeX = this.plateShake > 0 ? Math.sin(this.time * 60) * 5 * this.plateShake : 0;
    ctx.save();
    ctx.translate(shakeX, -bounce);
    if (this.plate.length === 0) {
      drawPlate(ctx, L.plateCx, L.plateY, L.plateW);
      text(ctx, 'empty plate', L.plateCx, L.plateY + 2, 13, '#b39b72', 'center', 'normal');
    } else {
      drawPlateStack(ctx, this.plate, L.plateCx, L.plateY, L.plateW);
    }
    ctx.restore();

    // The grill.
    ctx.fillStyle = '#43484e';
    rr(ctx, L.grillX, L.grillY, L.grillW, L.grillH, 16);
    ctx.fill();
    ctx.fillStyle = '#2f3338';
    rr(ctx, L.grillX + 10, L.grillY + 10, L.grillW - 20, L.grillH - 52, 12);
    ctx.fill();
    for (let i = 0; i < 3; i++) this.renderGrillSlot(ctx, i);
    text(ctx, '★ GRILL ★', L.grillX + L.grillW / 2, L.grillY + L.grillH - 20, 15, '#ffd76a');
    text(ctx, 'click a slot when its bar is in the gold', L.grillX + L.grillW / 2, L.grillY + L.grillH - 40, 10, '#9aa3ab', 'center', 'normal');

    // Serve and trash buttons, and the pass.
    const serveHover = this.hover && this.hover.kind === 'serve';
    ctx.fillStyle = serveHover ? '#67b95c' : '#58a34c';
    rr(ctx, L.serveRect.x, L.serveRect.y, L.serveRect.w, L.serveRect.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#3c7038';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // The service bell.
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(L.serveRect.x + 52, L.serveRect.y + 40, 19, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(L.serveRect.x + 30, L.serveRect.y + 40, 44, 6);
    ctx.beginPath();
    ctx.arc(L.serveRect.x + 52, L.serveRect.y + 21, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'SERVE', L.serveRect.x + 168, L.serveRect.y + 34, 30, '#ffffff');
    text(ctx, 'space — match a ticket exactly', L.serveRect.x + 168, L.serveRect.y + 62, 11.5, '#dff0da', 'center', 'normal');

    const trashHover = this.hover && this.hover.kind === 'trash';
    ctx.fillStyle = trashHover ? '#c9544c' : '#b04a42';
    rr(ctx, L.trashRect.x, L.trashRect.y, L.trashRect.w, L.trashRect.h, 12);
    ctx.fill();
    text(ctx, 'TRASH PLATE  (X)', L.trashRect.x + L.trashRect.w / 2, L.trashRect.y + 31, 16, '#ffe9e4');

    ctx.fillStyle = 'rgba(40,26,14,0.55)';
    rr(ctx, L.passRect.x, L.passRect.y, L.passRect.w, L.passRect.h, 10);
    ctx.fill();
    if (this.lastServed) {
      text(ctx, `SERVED: ${this.lastServed.name}`, L.passRect.x + L.passRect.w / 2, L.passRect.y + 20, 14.5, '#ffe9b0');
      text(ctx, `the till took $${this.lastServed.payout}`, L.passRect.x + L.passRect.w / 2, L.passRect.y + 40, 11.5, '#d9c9a8', 'center', 'normal');
    } else {
      text(ctx, 'THE PASS', L.passRect.x + L.passRect.w / 2, L.passRect.y + 20, 13, '#d9c9a8');
      text(ctx, 'served dishes land here', L.passRect.x + L.passRect.w / 2, L.passRect.y + 40, 11.5, '#b39b72', 'center', 'normal');
    }
  }

  renderGrillSlot(ctx, i) {
    const L = LAYOUT;
    const x = L.slotX(i);
    const y = L.slotY;
    const slot = this.grill.slots[i];
    const shake = this.slotShake.get(i) || 0;
    ctx.save();
    if (shake > 0) ctx.translate(Math.sin(this.time * 55) * 4 * shake, 0);
    ctx.fillStyle = '#22252a';
    rr(ctx, x, y, L.slotW, L.slotH, 10);
    ctx.fill();
    // Grate lines.
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 3;
    for (let gLine = 1; gLine <= 3; gLine++) {
      ctx.beginPath();
      ctx.moveTo(x + 10, y + gLine * 26);
      ctx.lineTo(x + L.slotW - 10, y + gLine * 26);
      ctx.stroke();
    }
    if (!slot.busy) {
      text(ctx, 'empty', x + L.slotW / 2, y + 52, 12, '#6d777e', 'center', 'normal');
    } else {
      const state = slot.state;
      if (state === 'perfect') {
        ctx.strokeStyle = '#ffd76a';
        ctx.lineWidth = 3.5;
        rr(ctx, x + 2, y + 2, L.slotW - 4, L.slotH - 4, 9);
        ctx.stroke();
      } else if (state === 'burnt') {
        ctx.strokeStyle = '#d64541';
        ctx.lineWidth = 3;
        rr(ctx, x + 2, y + 2, L.slotW - 4, L.slotH - 4, 9);
        ctx.stroke();
      }
      const shown = state === 'raw' ? 'raw' : state;
      drawIngredient(ctx, slot.ingredientId, x + L.slotW / 2, y + 84, 106, shown);
      // The doneness bar, drawn on the same scale the marker uses
      // (progress / 1.3): grey raw stretch, gold window, amber overrun.
      const barX = x + 10;
      const barW = L.slotW - 20;
      const barY = y + L.slotH - 20;
      ctx.fillStyle = '#4a4f55';
      rr(ctx, barX, barY, barW, 9, 4);
      ctx.fill();
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(barX + barW * (0.65 / 1.3), barY, barW * (0.35 / 1.3), 9);
      ctx.fillStyle = '#e07b39';
      ctx.fillRect(barX + barW * (1.0 / 1.3), barY, barW * (0.22 / 1.3), 9);
      const marker = Math.min(1, slot.progress / 1.3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX + barW * marker - 1.5, barY - 3, 3, 15);
      const label = state === 'raw' ? 'RAW…' : state === 'perfect' ? 'PERFECT — CLICK!' : state === 'overdone' ? 'OVERDONE' : 'BURNT!';
      text(ctx, label, x + L.slotW / 2, y + 16, 11.5, state === 'perfect' ? '#ffd76a' : state === 'burnt' ? '#ff8a80' : '#c8ced3');
    }
    ctx.restore();
  }

  renderHud(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 62);
    g.addColorStop(0, '#6f452a');
    g.addColorStop(1, '#59331d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, 62);
    ctx.fillStyle = '#e8a91c';
    ctx.fillRect(0, 60, VIEW_W, 2.5);
    // Mini skillet logo.
    ctx.fillStyle = '#2f3338';
    ctx.beginPath();
    ctx.arc(34, 31, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(46, 27, 20, 7);
    ctx.fillStyle = '#e8833a';
    ctx.beginPath();
    ctx.arc(34, 31, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(34, 31, 4.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'SIZZLE & SKILLET', 76, 32, 21, '#ffe9b0', 'left');
    // Day clock: a sun travelling a track.
    text(ctx, 'DAY 1', 452, 32, 14, '#d9c9a8', 'right');
    const trackX = 466;
    const trackW = 320;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    rr(ctx, trackX, 25, trackW, 13, 6);
    ctx.fill();
    ctx.fillStyle = '#7ec3ea';
    if (this.dayProgress > 0.01) {
      rr(ctx, trackX, 25, trackW * this.dayProgress, 13, 6);
      ctx.fill();
    }
    const sunX = trackX + trackW * this.dayProgress;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(sunX, 31, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = 2;
    ctx.stroke();
    const left = Math.ceil(this.dayLeft);
    text(ctx, `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} LEFT`, 800, 32, 14, '#ffe9b0', 'left');
    // Till, served count and combo.
    drawCoin(ctx, 952, 31, 12);
    text(ctx, `$${this.coins}`, 970, 32, 20, '#ffe98a', 'left');
    text(ctx, `SERVED ${this.servedCount}`, 1096, 32, 14.5, '#f4ede1', 'right');
    if (this.combo >= 2) {
      text(ctx, `🔥 ×${this.combo}`, 1258, 32, 17, '#ffb02e', 'right');
    } else {
      text(ctx, `BEST ×${this.bestCombo}`, 1258, 32, 12.5, '#b39b72', 'right');
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      const frac = p.life / p.maxLife;
      if (p.kind === 'steam' || p.kind === 'smoke') {
        drawSteamPuff(ctx, p.x, p.y, p.size * (0.7 + frac), (1 - frac) * (p.kind === 'smoke' ? 0.4 : 0.3));
      } else {
        ctx.fillStyle = `rgba(255, 205, 60, ${1 - frac})`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(frac * 2.4);
        ctx.fillRect(-p.size / 2, -1.6, p.size, 3.2);
        ctx.fillRect(-1.6, -p.size / 2, 3.2, p.size);
        ctx.restore();
      }
    }
    for (const f of this.floaters) {
      const frac = f.life / f.maxLife;
      ctx.save();
      ctx.globalAlpha = 1 - frac * frac;
      text(ctx, f.label, f.x, f.y - frac * 44, 21, f.color);
      ctx.restore();
    }
  }

  renderHint(ctx) {
    if (!this.hint || this.time > this.hintUntil || this.screen !== 'play') return;
    ctx.save();
    ctx.font = "600 14.5px 'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";
    const w = Math.min(880, ctx.measureText(this.hint).width + 44);
    ctx.fillStyle = 'rgba(40,26,14,0.82)';
    rr(ctx, (VIEW_W - w) / 2, 762, w, 30, 15);
    ctx.fill();
    text(ctx, this.hint, VIEW_W / 2, 778, 14.5, '#ffe9b0', 'center', '600');
    ctx.restore();
  }

  renderTitle(ctx) {
    ctx.fillStyle = 'rgba(43,24,10,0.55)';
    ctx.fillRect(0, 62, VIEW_W, VIEW_H - 62);
    ctx.save();
    ctx.fillStyle = '#fff7e6';
    rr(ctx, 340, 148, 600, 470, 20);
    ctx.fill();
    ctx.strokeStyle = '#d9b98a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'SIZZLE & SKILLET', 640, 216, 44, '#b8443c');
    text(ctx, 'a tiny diner rush', 640, 254, 17, '#8a6420', 'center', 'normal');
    // A skillet with a fried egg, drawn big.
    ctx.fillStyle = '#2f3338';
    ctx.beginPath();
    ctx.arc(640, 322, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(676, 314, 62, 15);
    drawIngredient(ctx, 'egg', 640, 330, 74, 'perfect');
    const lines = [
      'Tickets pin to the board — each wants its stack, bottom to top.',
      'Click a bin: fresh food lands on the plate, raw food hits the grill.',
      'Pull grill food in the GOLD window for perfect tips.',
      'Hit SERVE to match a ticket. Don’t keep faces waiting!',
      'One day lasts 2:30. Fill the till, chase the combo.',
    ];
    lines.forEach((line, i) => {
      text(ctx, line, 640, 396 + i * 27, 15.5, '#4a2f1d', 'center', 'normal');
    });
    const pulse = 0.5 + Math.sin(this.time * 3.2) * 0.5;
    ctx.fillStyle = pulse > 0.5 ? '#58a34c' : '#4c9443';
    rr(ctx, 470, 548, 340, 48, 12);
    ctx.fill();
    text(ctx, 'CLICK TO OPEN THE DINER', 640, 573, 18, '#ffffff');
    ctx.restore();
  }

  renderEnd(ctx) {
    ctx.fillStyle = 'rgba(43,24,10,0.6)';
    ctx.fillRect(0, 62, VIEW_W, VIEW_H - 62);
    ctx.save();
    ctx.fillStyle = '#fff7e6';
    rr(ctx, 390, 168, 500, 430, 20);
    ctx.fill();
    ctx.strokeStyle = '#d9b98a';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(ctx, 'DAY COMPLETE!', 640, 224, 36, '#b8443c');
    // Stars.
    for (let i = 0; i < 3; i++) {
      const sx = 640 + (i - 1) * 64;
      drawStar(ctx, sx, 276, 24, i < this.stars ? '#ffb02e' : '#ddd2ba');
    }
    const rows = [
      ['Dishes served', String(this.servedCount)],
      ['Coins in the till', `$${this.coins}`],
      ['Best combo', `×${this.bestCombo}`],
      ['Perfect cooks', String(this.perfectCooks)],
      ['Walk-outs', String(this.walkouts)],
    ];
    rows.forEach(([label, value], i) => {
      const ry = 330 + i * 38;
      text(ctx, label, 452, ry, 17, '#4a2f1d', 'left', 'normal');
      text(ctx, value, 828, ry, 17, '#8a6420', 'right');
    });
    const verdict = this.stars === 3 ? 'The diner is famous by sundown!' : this.stars === 2 ? 'A solid day — regulars will return.' : this.stars === 1 ? 'The till rattles, if quietly.' : 'Rough day. The grill believes in you.';
    text(ctx, verdict, 640, 536, 15, '#8a6420', 'center', 'normal');
    ctx.fillStyle = '#58a34c';
    rr(ctx, 490, 552, 300, 34, 10);
    ctx.fill();
    text(ctx, 'CLICK TO PLAY AGAIN', 640, 570, 15, '#ffffff');
    ctx.restore();
  }
}

function slotCenterX(i) {
  return LAYOUT.slotX(i) + LAYOUT.slotW / 2;
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
