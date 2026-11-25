// recipes.js — the Sizzle & Skillet menu: every ingredient on the counter and
// every dish the customers can order. Pure data, no drawing, no state: the
// order board, the grill and the plate all read their rules from here.

// How tall each ingredient sits in a plated stack, in logical pixels, and how
// long a cooked ingredient needs on the grill before it is ready.
export const INGREDIENTS = {
  bunBase: { name: 'Bun Base', stackHeight: 17, cookSeconds: 0 },
  patty: { name: 'Beef Patty', stackHeight: 16, cookSeconds: 5.0 },
  cheese: { name: 'Cheese Slice', stackHeight: 7, cookSeconds: 0 },
  lettuce: { name: 'Lettuce', stackHeight: 10, cookSeconds: 0 },
  tomato: { name: 'Tomato', stackHeight: 9, cookSeconds: 0 },
  egg: { name: 'Fried Egg', stackHeight: 11, cookSeconds: 3.6 },
  bacon: { name: 'Bacon', stackHeight: 8, cookSeconds: 4.2 },
  bunTop: { name: 'Bun Top', stackHeight: 26, cookSeconds: 0 },
};

// The order the ingredient bins stand on the counter, left to right. The
// number keys 1-8 pick a bin in this same order.
export const BIN_ORDER = ['bunBase', 'patty', 'cheese', 'lettuce', 'tomato', 'egg', 'bacon', 'bunTop'];

// A dish is its recipe as a stack read bottom to top, exactly as the ticket
// prints it. unlockAt is the second of the day from which customers may
// order it, so the menu grows as the rush builds.
export const DISHES = [
  { name: 'Classic Stack', recipe: ['bunBase', 'patty', 'cheese', 'bunTop'], price: 12, unlockAt: 0 },
  { name: 'Garden Stack', recipe: ['bunBase', 'patty', 'lettuce', 'tomato', 'bunTop'], price: 14, unlockAt: 0 },
  { name: 'Sunrise Stack', recipe: ['bunBase', 'patty', 'cheese', 'egg', 'bunTop'], price: 16, unlockAt: 0 },
  { name: 'Bacon Crunch', recipe: ['bunBase', 'bacon', 'lettuce', 'tomato', 'bunTop'], price: 15, unlockAt: 35 },
  { name: 'Farmhouse Stack', recipe: ['bunBase', 'bacon', 'egg', 'cheese', 'bunTop'], price: 17, unlockAt: 70 },
  { name: 'Double Trouble', recipe: ['bunBase', 'patty', 'cheese', 'patty', 'cheese', 'bunTop'], price: 21, unlockAt: 105 },
];

export function dishesAvailableAt(dayElapsed) {
  return DISHES.filter((dish) => dayElapsed >= dish.unlockAt);
}

// How long a fresh ticket's customer will wait, in seconds: longer stacks
// buy a little more time, and the whole day tightens as it goes on.
export function patienceFor(dish, dayProgress) {
  const base = 30 + dish.recipe.length * 4.5;
  return base * (1 - 0.25 * dayProgress);
}

// The grill's doneness bands, as fractions of an ingredient's cook time:
// before READY_AT it is raw, READY_AT..PERFECT_UNTIL is the golden window,
// past BURNT_AT it is charcoal.
export const READY_AT = 0.65;
export const PERFECT_UNTIL = 1.0;
export const BURNT_AT = 1.22;

export function doneness(progress) {
  if (progress < READY_AT) return 'raw';
  if (progress <= PERFECT_UNTIL) return 'perfect';
  if (progress <= BURNT_AT) return 'overdone';
  return 'burnt';
}
