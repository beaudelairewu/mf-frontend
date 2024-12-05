// src/utils/modelUtils.js
import { RANDOM_MODELS } from "../constants/api";
let lastUsedRandomIndices = [];

export const getRandomModel = () => {
  let availableIndices = Array.from({ length: RANDOM_MODELS.length }, (_, i) => i)
    .filter(i => !lastUsedRandomIndices.includes(i));

  if (availableIndices.length === 0) {
    lastUsedRandomIndices = [];
    availableIndices = Array.from({ length: RANDOM_MODELS.length }, (_, i) => i);
  }

  const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  lastUsedRandomIndices.push(randomIndex);

  if (lastUsedRandomIndices.length > RANDOM_MODELS.length / 2) {
    lastUsedRandomIndices.shift();
  }

  return RANDOM_MODELS[randomIndex];
};
