import type { Workout } from "@/domain/workout.types";
import type { WorkoutRepository } from "../workout.repository";

export class InMemoryWorkoutRepository implements WorkoutRepository {
    private readonly map = new Map<number, Workout[]>();

    save(chatId: number, workout: Workout): void {
        const list = this.map.get(chatId) ?? [];
        this.map.set(chatId, [...list, workout]);
    }
}
