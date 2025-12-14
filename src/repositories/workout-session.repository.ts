import type { WorkoutSession } from '@/domain/workout.types';

export interface WorkoutSessionRepository {
  get(chatId: number): WorkoutSession | null;
  save(chatId: number, session: WorkoutSession): void;
  remove(chatId: number): void;
}
