import { landAnimals } from './landAnimals.js';
import { oceanAnimals } from './oceanAnimals.js';
import { arcticAnimals } from './arcticAnimals.js';
import { desertAnimals } from './desertAnimals.js';
import { mythicalAnimals } from './mythicalAnimals.js';

export const animals = [
  ...landAnimals,
  ...oceanAnimals,
  ...arcticAnimals,
  ...desertAnimals,
  ...mythicalAnimals
];
