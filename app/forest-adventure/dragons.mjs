export function createSmallDragon(origin, phase, level) {
  const hp = level > 1 ? 2 : 1;
  const safeLevel = Math.max(1, Math.min(3, level));
  return {
    x: origin,
    y: 320,
    w: 64,
    h: 48,
    origin,
    phase,
    hp,
    maxHp: hp,
    alive: true,
    lastShot: -1.8,
    facing: 1,
    kind: 'small',
    level: safeLevel,
  };
}

export function createDragonGuardian(level) {
  if (level === 2) {
    return {
      x: 5035, y: 274, w: 142, h: 112, origin: 5035,
      hp: 5, maxHp: 5, lastShot: 0, phase: 0.8, baseY: 274,
      alive: true, facing: -1, kind: 'elder',
    };
  }
  if (level === 3) {
    return {
      x: 6865, y: 258, w: 164, h: 128, origin: 6865,
      hp: 8, maxHp: 8, lastShot: 0, phase: 1.7, baseY: 258,
      alive: true, facing: -1, kind: 'ancient',
    };
  }
  return null;
}

export function hitDragon(dragon, damage = 1) {
  if (!dragon?.alive || !Number.isFinite(damage) || damage <= 0) {
    return { ...dragon, damaged: false };
  }
  const hp = Math.max(0, dragon.hp - damage);
  return { ...dragon, hp, alive: hp > 0, damaged: true, defeated: hp === 0 };
}

export function dragonVolley(dragon, playerX, elapsed) {
  const isSmall = dragon?.kind === 'small';
  const cooldown = isSmall ? [4.4, 3.7, 3.1][(dragon.level || 1) - 1] : 2.35;
  const range = isSmall ? 620 : 760;
  if (!dragon?.alive || Math.abs(playerX - dragon.x) > range || elapsed - dragon.lastShot < cooldown) {
    return { shots: [], lastShot: dragon?.lastShot ?? elapsed };
  }
  const dir = playerX < dragon.x ? -1 : 1;
  const enraged = !isSmall && dragon.hp <= Math.ceil(dragon.maxHp / 3);
  const spread = isSmall ? (dragon.level === 1 ? [0] : dragon.level === 2 ? [-28, 28] : [-48, 48]) : (enraged ? [-120, -40, 40, 120] : [-52, 52]);
  const speed = isSmall ? [175, 205, 230][(dragon.level || 1) - 1] : enraged ? 300 : 250;
  return {
    lastShot: elapsed,
    shots: spread.map((vy, index) => ({
      x: dragon.x + (dir < 0 ? 5 : dragon.w - 5),
      y: dragon.y + dragon.h * (0.36 + index * 0.035),
      vx: dir * speed,
      vy,
      life: 2.6,
      kind: 'dragon-fire',
    })),
  };
}
