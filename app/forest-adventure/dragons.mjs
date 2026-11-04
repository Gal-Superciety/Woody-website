export function createSmallDragon(origin, phase, level) {
  const hp = level > 1 ? 2 : 1;
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
  };
}

export function createDragonGuardian(level) {
  if (level === 2) {
    return {
      x: 5035, y: 274, w: 142, h: 112, origin: 5035,
      hp: 6, maxHp: 6, lastShot: -2.4, phase: 0.8,
      alive: true, facing: -1, kind: 'elder',
    };
  }
  if (level === 3) {
    return {
      x: 6865, y: 258, w: 164, h: 128, origin: 6865,
      hp: 10, maxHp: 10, lastShot: -2.8, phase: 1.7,
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
  if (!dragon?.alive || Math.abs(playerX - dragon.x) > 760 || elapsed - dragon.lastShot < 2.35) {
    return { shots: [], lastShot: dragon?.lastShot ?? elapsed };
  }
  const dir = playerX < dragon.x ? -1 : 1;
  const enraged = dragon.hp <= Math.ceil(dragon.maxHp / 3);
  const spread = enraged ? [-120, -40, 40, 120] : [-52, 52];
  return {
    lastShot: elapsed,
    shots: spread.map((vy, index) => ({
      x: dragon.x + (dir < 0 ? 5 : dragon.w - 5),
      y: dragon.y + dragon.h * (0.36 + index * 0.035),
      vx: dir * (enraged ? 330 : 275),
      vy,
      life: 2.6,
      kind: 'dragon-fire',
    })),
  };
}
