// grill.js — the grill: three slots where patties, eggs and bacon cook.
// A slot's progress runs 0..past 1; recipes.js names the bands (raw,
// perfect, overdone, burnt). Landing in the golden window is the game's
// core skill, so the grill reports the exact moment a slot turns perfect.

import { INGREDIENTS, doneness } from './recipes.js';

export class GrillSlot {
  constructor() {
    this.ingredientId = null;
    this.elapsed = 0;
    this.dinged = false; // the perfect-window bell has rung for this item
  }

  get busy() {
    return this.ingredientId !== null;
  }

  get progress() {
    if (!this.busy) return 0;
    return this.elapsed / INGREDIENTS[this.ingredientId].cookSeconds;
  }

  get state() {
    if (!this.busy) return 'empty';
    return doneness(this.progress);
  }

  place(ingredientId) {
    this.ingredientId = ingredientId;
    this.elapsed = 0;
    this.dinged = false;
  }

  clear() {
    this.ingredientId = null;
    this.elapsed = 0;
    this.dinged = false;
  }
}

export class Grill {
  constructor() {
    this.slots = [new GrillSlot(), new GrillSlot(), new GrillSlot()];
  }

  get busyCount() {
    return this.slots.filter((s) => s.busy).length;
  }

  firstFree() {
    return this.slots.find((s) => !s.busy) || null;
  }

  // Puts a raw ingredient on a free slot. Returns false when the grill is
  // full, so the caller can complain instead of losing the food.
  place(ingredientId) {
    const slot = this.firstFree();
    if (!slot) return false;
    slot.place(ingredientId);
    return true;
  }

  // Advances cooking. Returns the slots that entered the perfect window on
  // this tick, so the game can ring the bell once per item.
  update(dt) {
    const turnedPerfect = [];
    for (const slot of this.slots) {
      if (!slot.busy) continue;
      slot.elapsed += dt;
      if (!slot.dinged && slot.state === 'perfect') {
        slot.dinged = true;
        turnedPerfect.push(slot);
      }
    }
    return turnedPerfect;
  }

  clear() {
    for (const slot of this.slots) slot.clear();
  }
}
