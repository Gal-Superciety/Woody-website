import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame, stepForest } from '../app/forest-adventure/simulation.mjs';
import { FOREST_REPLAY_VERSION, replayForest } from '../app/forest-adventure/replay.mjs';

test('Forest replay replays the same scoring rules as the rendered game', () => {
  const game = createGame(1);
  const inputs = [];
  // Run toward the first hazards and jump twice before letting the round end.
  for (let step = 0; step < 16203 && !game.ended; step++) {
    game.keys.right = step < 180;
    game.keys.jump = step === 24 || step === 142;
    inputs.push(((game.keys.right ? 2 : 0) | (game.keys.jump ? 4 : 0)).toString(16));
    stepForest(game, { visuals: true });
  }
  assert.equal(game.ended, true);
  const replay = { version: FOREST_REPLAY_VERSION, level: 1, inputs: inputs.join('') };
  assert.deepEqual(replayForest({ ...replay, score: 100000 }), {
    level: 1,
    score: game.score,
    durationMs: Math.round(inputs.length / 60 * 1000),
    completed: game.won,
  });
  assert.equal(replayForest({ ...replay, inputs: replay.inputs.slice(0, -1) }), null);
  assert.equal(replayForest({ ...replay, inputs: replay.inputs + '0' }), null);
  assert.equal(replayForest({ ...replay, inputs: 'z' + replay.inputs.slice(1) }), null);
});
