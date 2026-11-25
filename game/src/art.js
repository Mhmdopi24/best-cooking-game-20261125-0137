// art.js — every picture in Sizzle & Skillet is drawn here, in code, on a
// canvas: the kitchen backdrop, the food, the order tickets, the grill and
// the counter bins. No image files exist anywhere in the game.

import { INGREDIENTS } from './recipes.js';

// INGREDIENTS is used by the ticket painter, which shows cooked food cooked.

// A stable pseudo-random from an index, so the backdrop's jars and lights
// sit in the same place every frame instead of flickering.
export function decorRand(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold', font = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- food ----

// Draws one ingredient centred on cx, standing on baseY, w wide. quality is
// 'fresh' for counter food, or the grill's word for cooked food: 'raw',
// 'perfect', 'overdone', 'burnt'. This one drawing serves the bins, the
// plate stack, the grill and the mini stacks printed on tickets.
export function drawIngredient(ctx, id, cx, baseY, w, quality = 'fresh') {
  const h = w * 0.3;
  ctx.save();
  if (id === 'bunBase') {
    const g = ctx.createLinearGradient(0, baseY - h, 0, baseY);
    g.addColorStop(0, '#f2b96e');
    g.addColorStop(1, '#dd9440');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.lineTo(cx - w / 2, baseY - h * 0.55);
    ctx.quadraticCurveTo(cx, baseY - h * 1.15, cx + w / 2, baseY - h * 0.55);
    ctx.lineTo(cx + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,235,190,0.8)';
    ctx.fillRect(cx - w / 2 + 3, baseY - h * 0.62, w - 6, 3);
  } else if (id === 'bunTop') {
    const g = ctx.createLinearGradient(0, baseY - h * 1.5, 0, baseY);
    g.addColorStop(0, '#f7c877');
    g.addColorStop(1, '#e09c3f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.quadraticCurveTo(cx - w / 2, baseY - h * 1.55, cx, baseY - h * 1.55);
    ctx.quadraticCurveTo(cx + w / 2, baseY - h * 1.55, cx + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    for (let i = 0; i < 7; i++) {
      const sx = cx + (decorRand(i * 3 + w) - 0.5) * w * 0.66;
      const sy = baseY - h * (0.55 + decorRand(i * 7 + w) * 0.75);
      ctx.beginPath();
      ctx.ellipse(sx, sy, w * 0.045, w * 0.025, decorRand(i) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    const raw = quality === 'raw' || quality === 'fresh';
    ctx.fillStyle = quality === 'burnt' ? '#2e2019' : raw ? '#cf7d76' : quality === 'overdone' ? '#6e4525' : '#845231';
    rr(ctx, cx - w / 2, baseY - h * 0.95, w, h * 0.95, h * 0.45);
    ctx.fill();
    if (!raw && quality !== 'burnt') {
      ctx.strokeStyle = 'rgba(40,20,8,0.5)';
      ctx.lineWidth = Math.max(1.5, w * 0.02);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * w * 0.26 - w * 0.1, baseY - h * 0.8);
        ctx.lineTo(cx + i * w * 0.26 + w * 0.1, baseY - h * 0.2);
        ctx.stroke();
      }
    }
    if (raw) {
      ctx.fillStyle = 'rgba(255,210,200,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.2, baseY - h * 0.6, w * 0.16, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    // A thin slice, a touch narrower than the patty it melts over, with two
    // slow drips running off its front edge.
    ctx.fillStyle = quality === 'burnt' ? '#7a4d12' : '#ffb02e';
    ctx.save();
    ctx.translate(cx, baseY - h * 0.18);
    ctx.rotate(0.05);
    const cw = w * 0.94;
    rr(ctx, -cw / 2, -h * 0.3, cw, h * 0.52, 4);
    ctx.fill();
    ctx.fillStyle = quality === 'burnt' ? '#7a4d12' : '#ffc154';
    rr(ctx, -cw / 2, -h * 0.3, cw, h * 0.2, 4);
    ctx.fill();
    ctx.fillStyle = quality === 'burnt' ? '#7a4d12' : '#ffb02e';
    for (const [dx, len] of [[-0.3, 0.62], [0.05, 0.85], [0.34, 0.5]]) {
      ctx.beginPath();
      ctx.moveTo(cw * dx - w * 0.045, h * 0.2);
      ctx.quadraticCurveTo(cw * dx - w * 0.05, h * len, cw * dx, h * (len + 0.12));
      ctx.quadraticCurveTo(cw * dx + w * 0.05, h * len, cw * dx + w * 0.045, h * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (id === 'lettuce') {
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = layer === 1 ? '#7cc453' : '#5da244';
      ctx.beginPath();
      const ly = baseY - layer * h * 0.16;
      ctx.moveTo(cx - w / 2, ly);
      for (let s = 0; s <= 6; s++) {
        const px = cx - w / 2 + (s / 6) * w;
        ctx.quadraticCurveTo(px - w / 12, ly - h * (0.34 + (s % 2) * 0.16), px, ly - h * 0.08);
      }
      ctx.lineTo(cx + w / 2, ly + h * 0.14);
      ctx.lineTo(cx - w / 2, ly + h * 0.14);
      ctx.closePath();
      ctx.fill();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = quality === 'burnt' ? '#571f18' : '#e2483d';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h * 0.5, w * 0.34, h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2796b';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h * 0.5, w * 0.24, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd9a8';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * w * 0.13, baseY - h * 0.5 + Math.sin(a) * h * 0.17, w * 0.028, h * 0.05, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = quality === 'burnt' ? '#8a6a48' : '#fff8ec';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, baseY - h * 0.25);
    ctx.bezierCurveTo(cx - w * 0.45, baseY - h * 0.95, cx - w * 0.1, baseY - h * 0.8, cx + w * 0.05, baseY - h * 0.95);
    ctx.bezierCurveTo(cx + w * 0.4, baseY - h * 1.05, cx + w * 0.46, baseY - h * 0.4, cx + w * 0.34, baseY - h * 0.2);
    ctx.bezierCurveTo(cx + w * 0.1, baseY + h * 0.05, cx - w * 0.3, baseY + h * 0.02, cx - w * 0.42, baseY - h * 0.25);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,164,90,0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const g = ctx.createRadialGradient(cx - w * 0.03, baseY - h * 0.62, 1, cx, baseY - h * 0.55, w * 0.17);
    g.addColorStop(0, '#ffd76a');
    g.addColorStop(1, quality === 'burnt' ? '#8a5a10' : '#ff9d2e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h * 0.55, w * 0.155, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'bacon') {
    const bh = h * 0.72; // bacon lies flatter than its box: two wavy strips
    for (let strip = -1; strip <= 1; strip += 2) {
      const bx = cx + strip * w * 0.2;
      ctx.strokeStyle = quality === 'burnt' ? '#33231c' : '#b8443c';
      ctx.lineWidth = w * 0.17;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx - w * 0.14, baseY);
      ctx.bezierCurveTo(bx - w * 0.3, baseY - bh * 0.5, bx + w * 0.24, baseY - bh * 0.55, bx + w * 0.08, baseY - bh * 1.05);
      ctx.stroke();
      ctx.strokeStyle = quality === 'burnt' ? '#4a3428' : '#eda58d';
      ctx.lineWidth = w * 0.055;
      ctx.beginPath();
      ctx.moveTo(bx - w * 0.14, baseY - bh * 0.08);
      ctx.bezierCurveTo(bx - w * 0.26, baseY - bh * 0.5, bx + w * 0.2, baseY - bh * 0.55, bx + w * 0.08, baseY - bh * 0.97);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------- the plate ----

export function drawPlate(ctx, cx, cy, w) {
  ctx.save();
  ctx.fillStyle = 'rgba(90,50,20,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + w * 0.05, w * 0.52, w * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(cx, cy - w * 0.04, w * 0.1, cx, cy, w * 0.55);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.75, '#f4ede1');
  g.addColorStop(1, '#d9cbb4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.52, w * 0.155, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8e0d8';
  ctx.lineWidth = w * 0.02;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.44, w * 0.125, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// A whole stack on a plate: plate first, then the ingredients bottom to top,
// each standing on the one below it.
export function drawPlateStack(ctx, stack, cx, plateY, plateW, scale = 1) {
  drawPlate(ctx, cx, plateY, plateW);
  let base = plateY - plateW * 0.03;
  const foodW = plateW * 0.62;
  for (let i = 0; i < stack.length; i++) {
    const item = stack[i];
    const jitter = (decorRand(i * 13 + item.id.length) - 0.5) * plateW * 0.03;
    drawIngredient(ctx, item.id, cx + jitter, base, foodW, item.quality || 'fresh');
    base -= INGREDIENTS[item.id].stackHeight * scale * (plateW / 240);
  }
  return base;
}

// ------------------------------------------------------------- the faces ----

const SKIN_TONES = ['#f6c48a', '#e8a869', '#c97e4e', '#8a5a34', '#ffd9ae'];
const HAIR_COLORS = ['#3a2a1c', '#7a4a26', '#c9c9c9', '#b8443c', '#2c4a7a', '#e8b13c'];

// A customer's face whose expression slides with mood: 1 is delighted,
// 0.5 is waiting, 0 is about to walk out.
export function drawCustomerFace(ctx, cx, cy, r, mood, seed = 0) {
  ctx.save();
  ctx.fillStyle = SKIN_TONES[seed % SKIN_TONES.length];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HAIR_COLORS[seed % HAIR_COLORS.length];
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.18, r, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(cx, cy - r * 0.35, cx - r * 0.98, cy - r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c2019';
  const eyeY = cy + r * 0.02;
  ctx.beginPath();
  ctx.arc(cx - r * 0.34, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.34, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c2019';
  ctx.lineWidth = Math.max(1.4, r * 0.09);
  ctx.lineCap = 'round';
  // Brows: level when happy, angled down when angry.
  const browLift = (mood - 0.5) * r * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, eyeY - r * 0.34 + browLift);
  ctx.lineTo(cx - r * 0.18, eyeY - r * 0.4 + browLift * 0.4);
  ctx.moveTo(cx + r * 0.5, eyeY - r * 0.34 + browLift);
  ctx.lineTo(cx + r * 0.18, eyeY - r * 0.4 + browLift * 0.4);
  ctx.stroke();
  // Mouth: a smile that flattens and turns down as mood falls.
  ctx.beginPath();
  const mouthY = cy + r * 0.42;
  const curve = (mood - 0.42) * r * 0.75;
  ctx.moveTo(cx - r * 0.36, mouthY);
  ctx.quadraticCurveTo(cx, mouthY + curve, cx + r * 0.36, mouthY);
  ctx.stroke();
  if (mood < 0.28) {
    ctx.fillStyle = 'rgba(230,80,60,0.35)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.62, cy + r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.62, cy + r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------- the board ----

// One order ticket pinned to the board. ticket is { dish, patience,
// patienceMax, seed, leaving } — see orders.js.
export function drawTicket(ctx, ticket, x, y, w, h, time) {
  ctx.save();
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  if (frac < 0.25 && !ticket.leaving) {
    x += Math.sin(time * 34) * 1.6;
  }
  // String from the rail and the pin.
  ctx.strokeStyle = 'rgba(120,84,40,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - 8);
  ctx.lineTo(x + w / 2, y + 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,50,20,0.28)';
  rr(ctx, x + 3, y + 5, w, h, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(1, '#fdeed3');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#d9b98a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#d64541';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 9, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x + w / 2 - 2, y + 7, 2.2, 0, Math.PI * 2);
  ctx.fill();

  drawCustomerFace(ctx, x + 24, y + 33, 14, frac, ticket.seed);
  text(ctx, ticket.dish.name, x + 44, y + 26, 15, '#4a2f1d', 'left');
  // Price, with a little coin.
  drawCoin(ctx, x + w - 34, y + 26, 9);
  text(ctx, String(ticket.dish.price), x + w - 20, y + 26, 15, '#8a6420', 'left');
  text(ctx, 'stack, bottom to top', x + 44, y + 45, 10.5, '#a2835c', 'left', 'normal');

  // The recipe as a mini stack on a mini plate, centred on the ticket.
  // Cooked ingredients are drawn cooked: the ticket shows the finished dish.
  const mini = ticket.dish.recipe.map((id) => ({
    id,
    quality: INGREDIENTS[id].cookSeconds > 0 ? 'perfect' : 'fresh',
  }));
  drawPlateStack(ctx, mini, x + w / 2, y + h - 42, 118, 0.62);

  // Patience bar along the bottom.
  const barX = x + 12;
  const barW = w - 24;
  const barY = y + h - 16;
  ctx.fillStyle = '#e3d3ae';
  rr(ctx, barX, barY, barW, 8, 4);
  ctx.fill();
  const hue = frac > 0.5 ? '#58a34c' : frac > 0.25 ? '#e8a13c' : '#d64541';
  ctx.fillStyle = hue;
  if (frac > 0.01) {
    rr(ctx, barX, barY, barW * frac, 8, 4);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCoin(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
  g.addColorStop(0, '#ffe98a');
  g.addColorStop(1, '#e8a91c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b87f10';
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.stroke();
  text(ctx, '$', cx, cy + r * 0.06, r * 1.15, '#9c6d0d');
}

// ---------------------------------------------------------- the backdrop ----

// The kitchen behind the play: warm wall, a sunny window, shelves of jars,
// hanging pans and a tiled backsplash, then the long wooden counter.
export function drawKitchenBackdrop(ctx, W, H, time) {
  // Wall.
  const wall = ctx.createLinearGradient(0, 60, 0, 440);
  wall.addColorStop(0, '#f8d7a8');
  wall.addColorStop(1, '#f0bd7f');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 60, W, 380);

  // Window with daylight, left of the shelves.
  const wx = 42, wy = 262, ww = 250, wh = 158;
  ctx.fillStyle = '#fff6e8';
  rr(ctx, wx - 8, wy - 8, ww + 16, wh + 16, 10);
  ctx.fill();
  const sky = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sky.addColorStop(0, '#9fd9f6');
  sky.addColorStop(1, '#e6f7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(wx + ww - 52, wy + 42, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [clx, cly, s] of [[50, 44, 1], [120, 66, 0.7], [180, 30, 0.55]]) {
    ctx.beginPath();
    ctx.ellipse(wx + clx, wy + cly, 26 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(wx + clx + 18 * s, wy + cly + 3 * s, 18 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#8ec97f';
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.quadraticCurveTo(wx + ww * 0.3, wy + wh - 34, wx + ww * 0.55, wy + wh);
  ctx.quadraticCurveTo(wx + ww * 0.8, wy + wh - 22, wx + ww, wy + wh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff6e8';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();
  // Awning over the window.
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#fff6e8' : '#d64541';
    ctx.beginPath();
    ctx.moveTo(wx - 12 + i * (ww + 24) / 6, wy - 26);
    ctx.lineTo(wx - 12 + (i + 1) * (ww + 24) / 6, wy - 26);
    ctx.lineTo(wx - 6 + (i + 1) * (ww + 24) / 6, wy - 6);
    ctx.lineTo(wx - 6 + i * (ww + 24) / 6, wy - 6);
    ctx.closePath();
    ctx.fill();
  }
  // Herb pots on the sill.
  for (let i = 0; i < 3; i++) {
    const px = wx + 34 + i * 82;
    ctx.fillStyle = '#c96f4a';
    rr(ctx, px - 13, wy + wh - 4, 26, 18, 3);
    ctx.fill();
    ctx.strokeStyle = '#4e8f3e';
    ctx.lineWidth = 2.5;
    for (let leaf = -1; leaf <= 1; leaf++) {
      ctx.beginPath();
      ctx.moveTo(px, wy + wh - 4);
      ctx.quadraticCurveTo(px + leaf * 8, wy + wh - 18, px + leaf * 11, wy + wh - 24 - Math.abs(leaf) * -3);
      ctx.stroke();
    }
  }

  // Shelves with jars and stacked plates, centre wall.
  for (const shelfY of [300, 366]) {
    ctx.fillStyle = '#a06838';
    rr(ctx, 330, shelfY, 420, 10, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(330, shelfY + 10, 420, 4);
  }
  for (let i = 0; i < 6; i++) {
    const jx = 352 + i * 44;
    const jarH = 30 + decorRand(i * 3) * 14;
    ctx.fillStyle = ['#d64541', '#e8a13c', '#58a34c', '#7a9cc9', '#c95d9c', '#e8d44c'][i];
    rr(ctx, jx, 300 - jarH, 30, jarH, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(jx + 4, 300 - jarH + 5, 6, jarH - 12);
    ctx.fillStyle = '#7a4a26';
    rr(ctx, jx - 2, 300 - jarH - 6, 34, 8, 3);
    ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const jx = 352 + i * 62;
    ctx.fillStyle = i % 2 ? '#9cc9d8' : '#e8b13c';
    rr(ctx, jx, 366 - 24, 24, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(jx - 2, 366 - 30, 28, 7);
  }
  // Stacked plates on the lower shelf.
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? '#f4ede1' : '#e8e0cd';
    ctx.beginPath();
    ctx.ellipse(690, 362 - i * 6, 34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // A hanging clock.
  ctx.fillStyle = '#fff6e8';
  ctx.beginPath();
  ctx.arc(792, 322, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a4a26';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = '#4a2f1d';
  ctx.lineWidth = 3;
  const ang = (time * 0.05) % (Math.PI * 2);
  ctx.beginPath();
  ctx.moveTo(792, 322);
  ctx.lineTo(792 + Math.cos(ang) * 15, 322 + Math.sin(ang) * 15);
  ctx.moveTo(792, 322);
  ctx.lineTo(792 + Math.cos(ang * 0.2 + 2) * 19, 322 + Math.sin(ang * 0.2 + 2) * 19);
  ctx.stroke();

  // Hanging pans on a rail, right wall.
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(848, 268, 392, 7);
  for (let i = 0; i < 4; i++) {
    const px = 884 + i * 96;
    const drop = 22 + decorRand(i * 11) * 22;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px, 275);
    ctx.lineTo(px, 275 + drop);
    ctx.stroke();
    const panR = 25 - (i % 2) * 5;
    const g = ctx.createRadialGradient(px - 6, 275 + drop + panR - 6, 3, px, 275 + drop + panR, panR);
    g.addColorStop(0, '#d8dee2');
    g.addColorStop(1, '#8d979e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, 275 + drop + panR, panR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6d777e';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (i === 2) {
      ctx.fillStyle = '#c96f4a';
      ctx.beginPath();
      ctx.arc(px, 275 + drop + panR, panR * 0.72, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tiled backsplash strip.
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 32; tx++) {
      ctx.fillStyle = (tx + ty) % 2 ? '#a8d8cf' : '#bfe6de';
      ctx.fillRect(tx * 40 + (ty ? 20 : 0) - 20, 404 + ty * 15, 38, 13);
    }
  }

  // The counter: steel worktop edge, then warm wood down to the floor line.
  const counter = ctx.createLinearGradient(0, 424, 0, H);
  counter.addColorStop(0, '#b57a44');
  counter.addColorStop(0.12, '#a06838');
  counter.addColorStop(1, '#7d4e2d');
  ctx.fillStyle = counter;
  ctx.fillRect(0, 436, W, H - 436);
  ctx.fillStyle = '#d8dee2';
  ctx.fillRect(0, 424, W, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0, 424, W, 3);
  ctx.strokeStyle = 'rgba(70,40,15,0.25)';
  ctx.lineWidth = 2;
  for (const seam of [560, 668, 776]) {
    ctx.beginPath();
    ctx.moveTo(0, seam + 92);
    ctx.lineTo(W, seam + 92);
    ctx.stroke();
  }
}

// The chalkboard menu that hangs beside the order rail.
export function drawChalkboard(ctx, x, y, w, h, dishes) {
  ctx.save();
  ctx.fillStyle = '#7a4a26';
  rr(ctx, x - 7, y - 7, w + 14, h + 14, 10);
  ctx.fill();
  ctx.fillStyle = '#2f4238';
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  rr(ctx, x + 7, y + 7, w - 14, h - 14, 5);
  ctx.stroke();
  text(ctx, "~ TODAY'S MENU ~", x + w / 2, y + 24, 19, '#ffe9b0', 'center', 'bold', "'Segoe Print', 'Comic Sans MS', cursive");
  ctx.strokeStyle = 'rgba(255,233,176,0.5)';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 42);
  ctx.lineTo(x + w - 24, y + 42);
  ctx.stroke();
  const rowH = (h - 58) / dishes.length;
  dishes.forEach((dish, i) => {
    const ry = y + 58 + i * rowH + rowH / 2 - 4;
    text(ctx, dish.name, x + 22, ry, 15.5, '#f4f1e4', 'left', 'normal', "'Segoe Print', 'Comic Sans MS', cursive");
    text(ctx, `$${dish.price}`, x + w - 22, ry, 15.5, '#ffe9b0', 'right', 'bold', "'Segoe Print', 'Comic Sans MS', cursive");
  });
  ctx.restore();
}

// ----------------------------------------------------------------- bins ----

// One ingredient bin on the back shelf: a steel tray of the ingredient, its
// name, and its number-key badge. hover lifts it a touch.
export function drawBin(ctx, id, x, y, w, h, keyLabel, hover, time) {
  ctx.save();
  if (hover) y -= 4;
  ctx.fillStyle = 'rgba(60,30,8,0.3)';
  rr(ctx, x + 3, y + 6, w, h, 10);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#e8edf0');
  g.addColorStop(1, '#b9c2c9');
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = hover ? '#ffb02e' : '#8d979e';
  ctx.lineWidth = hover ? 3 : 1.5;
  ctx.stroke();
  // The pile of food in the tray.
  const pileY = y + h - 34;
  if (id === 'egg') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#fff8ec';
      ctx.beginPath();
      ctx.ellipse(x + w * (0.3 + i * 0.2), pileY - 8, 13, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9cbb4';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  } else if (id === 'tomato') {
    drawIngredient(ctx, id, x + w * 0.32, pileY + 4, 52, 'fresh');
    drawIngredient(ctx, id, x + w * 0.68, pileY + 4, 52, 'fresh');
    drawIngredient(ctx, id, x + w * 0.5, pileY - 12, 52, 'fresh');
  } else {
    drawIngredient(ctx, id, x + w * 0.5, pileY + 6, Math.min(96, w * 0.66), 'fresh');
    drawIngredient(ctx, id, x + w * 0.5, pileY - 10, Math.min(96, w * 0.66), 'fresh');
  }
  // Name plate.
  ctx.fillStyle = '#4a2f1d';
  rr(ctx, x + 8, y + h - 26, w - 16, 19, 5);
  ctx.fill();
  text(ctx, INGREDIENTS[id].name.toUpperCase(), x + w / 2, y + h - 16, 11.5, '#ffe9b0');
  // Key badge.
  ctx.fillStyle = '#d64541';
  ctx.beginPath();
  ctx.arc(x + 15, y + 15, 10, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, keyLabel, x + 15, y + 15.5, 12, '#ffffff');
  // Cookable food wears a little grill tag in the top-right corner, drawn
  // last so the pile never covers it.
  if (INGREDIENTS[id].cookSeconds > 0) {
    ctx.fillStyle = '#b8443c';
    rr(ctx, x + w - 52, y + 6, 46, 15, 4);
    ctx.fill();
    text(ctx, 'GRILL', x + w - 29, y + 14, 9.5, '#ffe9e4');
  }
  ctx.restore();
}

// A soft steam puff, drawn by the particle system.
export function drawSteamPuff(ctx, x, y, r, alpha) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.7, y + r * 0.25, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x - r * 0.7, y + r * 0.3, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
