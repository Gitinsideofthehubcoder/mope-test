import { landAnimals } from './animals-part-1.js';
import { oceanAnimals } from './animals-part-2.js';
import { arcticAnimals } from './animals-part-3.js';
import { desertAnimals } from './animals-part-4.js';
import { mythicalAnimals } from './animals-part-5.js';

export const animals = [
  ...landAnimals,
  ...oceanAnimals,
  ...arcticAnimals,
  ...desertAnimals,
  ...mythicalAnimals
];
