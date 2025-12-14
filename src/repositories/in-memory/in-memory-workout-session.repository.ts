import type { WorkoutSession } from "@/domain/workout.types";
import type { WorkoutSessionRepository } from "../workout-session.repository";

export class InMemoryWorkoutSessionRepository implements WorkoutSessionRepository {
    private readonly map = new Map<number, WorkoutSession>();

    get(chatId: number): WorkoutSession | null {
        return this.map.get(chatId) ?? null;
    }

    save(chatId: number, session: WorkoutSession): void {
        this.map.set(chatId, session);
    }

    remove(chatId: number): void {
        this.map.delete(chatId);
    }
}
