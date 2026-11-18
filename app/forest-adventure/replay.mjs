import { createGame, FOREST_STEP_SECONDS, LEVELS, stepForest } from './simulation.mjs';

export const FOREST_REPLAY_VERSION = 1;
const STEPS_PER_SECOND = Math.round(1 / FOREST_STEP_SECONDS);

export function forestInputFrame({ left, right, jump, shoot }) {
  return (Number(left) | (Number(right) << 1) | (Number(jump) << 2) | (Number(shoot) << 3)).toString(16);
}

// Each entry describes the four buttons held for one simulation step.
// Bit order from least significant: left, right, jump, shoot.
export function replayForest({ version, level, inputs } = {}) {
  if (version !== FOREST_REPLAY_VERSION || !Number.isInteger(level) ||
      level < 1 || level > LEVELS.length || typeof inputs !== 'string') return null;

  const maxSteps = 3 * (LEVELS[level - 1].seconds * STEPS_PER_SECOND + 1);
  if (inputs.length === 0 || inputs.length > maxSteps || /[^0-9a-f]/.test(inputs)) return null;

  const game = createGame(level);
  for (let index = 0; index < inputs.length; index++) {
    const buttons = Number.parseInt(inputs[index], 16);
    game.keys.left = Boolean(buttons & 1);
    game.keys.right = Boolean(buttons & 2);
    game.keys.jump = Boolean(buttons & 4);
    game.keys.shoot = Boolean(buttons & 8);
    stepForest(game);
    if (game.ended && index !== inputs.length - 1) return null;
  }

  if (!game.ended) return null;
  return {
    level,
    score: game.score,
    durationMs: Math.round(inputs.length * FOREST_STEP_SECONDS * 1000),
    completed: game.won,
  };
}
