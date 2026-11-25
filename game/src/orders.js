// orders.js — the order board: tickets arrive, their customers wait, and
// patience runs out. An OrderTicket is one pinned ticket; OrderBoard owns
// the set of them, the spawn rhythm and the walk-outs.

import { dishesAvailableAt, patienceFor } from './recipes.js';

let nextTicketId = 1;

export class OrderTicket {
  constructor(dish, dayProgress, rng) {
    this.id = nextTicketId++;
    this.dish = dish;
    this.patienceMax = patienceFor(dish, dayProgress);
    this.patience = this.patienceMax;
    this.seed = Math.floor(rng() * 997);
    this.age = 0;
    this.leaving = false; // true while the walk-out animation plays
    this.leaveTimer = 0;
  }

  // Seconds of patience left as a fraction, the number the face and the
  // patience bar both read.
  get patienceFraction() {
    return Math.max(0, this.patience / this.patienceMax);
  }

  // The stack this ticket wants, as bare ingredient ids, bottom to top.
  get wantedIds() {
    return this.dish.recipe;
  }
}

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.spawnTimer = 0.8; // the first customer arrives almost at once
    this.maxOpen = 4;
  }

  get openCount() {
    return this.tickets.filter((t) => !t.leaving).length;
  }

  // Advances every ticket's patience. Returns the tickets whose customers
  // walked out on this tick, so the game can charge the strike.
  update(dt, dayElapsed, dayProgress) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.openCount < this.maxOpen) {
      this.spawn(dayElapsed, dayProgress);
      // Arrivals bunch up as the day wears on: 8.5s apart early, 5s late.
      this.spawnTimer = 8.5 - 3.5 * dayProgress + this.rng() * 1.6;
    }
    const walkedOut = [];
    for (const ticket of this.tickets) {
      ticket.age += dt;
      if (ticket.leaving) {
        ticket.leaveTimer += dt;
        continue;
      }
      ticket.patience -= dt;
      if (ticket.patience <= 0) {
        ticket.leaving = true;
        ticket.leaveTimer = 0;
        walkedOut.push(ticket);
      }
    }
    this.tickets = this.tickets.filter((t) => !t.leaving || t.leaveTimer < 0.9);
    return walkedOut;
  }

  spawn(dayElapsed, dayProgress) {
    const menu = dishesAvailableAt(dayElapsed);
    const dish = menu[Math.floor(this.rng() * menu.length)];
    const ticket = new OrderTicket(dish, dayProgress, this.rng);
    this.tickets.push(ticket);
    return ticket;
  }

  // Finds the happiest match for a finished plate: an open ticket whose
  // recipe is exactly the plate's stack. The most impatient match wins, so
  // serving never wastes a plate on a customer who could have waited.
  matchFor(plateIds) {
    let best = null;
    for (const ticket of this.tickets) {
      if (ticket.leaving) continue;
      const wanted = ticket.wantedIds;
      if (wanted.length !== plateIds.length) continue;
      if (!wanted.every((id, i) => id === plateIds[i])) continue;
      if (!best || ticket.patience < best.patience) best = ticket;
    }
    return best;
  }

  remove(ticket) {
    this.tickets = this.tickets.filter((t) => t !== ticket);
  }

  clear() {
    this.tickets = [];
  }
}
