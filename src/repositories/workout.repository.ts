import type { Workout } from '@/domain/workout.types';

export interface WorkoutRepository {
  save(chatId: number, workout: Workout): void;
}
