import type { WorkoutSplit } from '@/domain/workout.types';

export const SPLIT_KEYWORDS: Record<WorkoutSplit, readonly string[]> = {
  back_traps: ['спина', 'шраги', 'тяга', 'верхнего блока', 'к поясу', 'т-тяга'],
  chest_calves: ['грудь', 'жим', 'разводка', 'икры', 'икронож'],
  deadlift: ['становая', 'тяга становая'],
  shoulders_abs: ['плечи', 'дельты', 'махи', 'пресс', 'скручивания', 'планка'],
  legs: ['ноги', 'присед', 'выпады', 'квадрицепс', 'бедра', 'ягодицы'],
  arms: ['руки', 'бицепс', 'трицепс', 'молот', 'сгиб', 'разгиб'],
} as const;
