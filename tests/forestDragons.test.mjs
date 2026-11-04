import test from 'node:test';
import assert from 'node:assert/strict';
import { createDragonGuardian, createSmallDragon, dragonVolley, hitDragon } from '../app/forest-adventure/dragons.mjs';

test('small dragons are tougher in later levels', () => {
  assert.equal(createSmallDragon(900, 0, 1).maxHp, 1);
  assert.equal(createSmallDragon(900, 0, 2).maxHp, 2);
  assert.equal(createSmallDragon(900, 0, 3).maxHp, 2);
});

test('early small dragons use one slow fireball and later flocks scale up gradually', () => {
  const easy = createSmallDragon(900, 0, 1);
  const medium = createSmallDragon(900, 0, 2);
  assert.equal(dragonVolley(easy, 600, 2.5).shots.length, 0);
  assert.equal(dragonVolley(easy, 600, 2.7).shots.length, 1);
  assert.equal(dragonVolley(medium, 600, 2.5).shots.length, 2);
});

test('later levels add large dragons with more health than small dragons', () => {
  assert.equal(createDragonGuardian(1), null);
  assert.ok(createDragonGuardian(2).maxHp > createSmallDragon(900, 0, 2).maxHp);
  assert.ok(createDragonGuardian(3).maxHp > createDragonGuardian(2).maxHp);
});

test('large dragons take repeated fireball hits before defeat', () => {
  const guardian = createDragonGuardian(2);
  const firstHit = hitDragon(guardian);
  assert.equal(firstHit.hp, guardian.hp - 1);
  assert.equal(firstHit.alive, true);
  const defeated = hitDragon({ ...guardian, hp: 1 });
  assert.equal(defeated.alive, false);
  assert.equal(defeated.defeated, true);
});

test('dragon fire volleys have a cooldown and become wider when hurt', () => {
  const guardian = createDragonGuardian(2);
  assert.equal(dragonVolley(guardian, guardian.x - 300, 0).shots.length, 0);
  const volley = dragonVolley(guardian, guardian.x - 300, 2.5);
  assert.equal(volley.shots.length, 2);
  assert.ok(volley.shots.every(shot => shot.vx < 0 && shot.kind === 'dragon-fire'));
  const enraged = dragonVolley({ ...guardian, hp: 2, lastShot: -5 }, guardian.x + 300, 3);
  assert.equal(enraged.shots.length, 4);
  assert.ok(enraged.shots.every(shot => shot.vx > 0));
});
