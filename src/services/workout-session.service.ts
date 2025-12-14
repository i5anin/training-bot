import type { Exercise, ISODate, SetEntry, Workout, WorkoutSession, WorkoutSplit } from "@/domain/workout.types";
import type { WorkoutRepository } from "@/repositories/workout.repository";
import type { WorkoutSessionRepository } from "@/repositories/workout-session.repository";
import type { WorkoutLineParser } from "@/parser/workout-line.parser";

export class WorkoutSessionService {
    constructor(
        private readonly sessions: WorkoutSessionRepository,
        private readonly workouts: WorkoutRepository,
        private readonly parser: WorkoutLineParser,
    ) {}

    start(chatId: number, date: ISODate): WorkoutSession {
        const session: WorkoutSession = { step: "choose_split", date, exercises: [] };
        this.sessions.save(chatId, session);
        return session;
    }

    get(chatId: number): WorkoutSession | null {
        return this.sessions.get(chatId);
    }

    setCardMessageId(chatId: number, messageId: number): WorkoutSession | null {
        const current = this.sessions.get(chatId);
        if (!current) return null;
        const next: WorkoutSession = { ...current, cardMessageId: messageId };
        this.sessions.save(chatId, next);
        return next;
    }

    chooseSplit(chatId: number, split: WorkoutSplit): WorkoutSession | null {
        const current = this.sessions.get(chatId);
        if (!current) return null;
        const next: WorkoutSession = { ...current, split, step: "collecting" };
        this.sessions.save(chatId, next);
        return next;
    }

    cancel(chatId: number): void {
        this.sessions.remove(chatId);
    }

    addLine(chatId: number, text: string): WorkoutSession | null {
        const current = this.sessions.get(chatId);
        if (!current || current.step !== "collecting") return null;

        const parsed = this.parser.parse(text);

        if (parsed.kind === "exercise") {
            const next: WorkoutSession = {
                ...current,
                currentExercise: parsed.name,
                exercises: this.ensureExercise(current.exercises, parsed.name),
            };
            this.sessions.save(chatId, next);
            return next;
        }

        const exerciseName = current.currentExercise ?? "Без названия";
        const withExercise: WorkoutSession = current.currentExercise
            ? current
            : { ...current, currentExercise: exerciseName, exercises: this.ensureExercise(current.exercises, exerciseName) };

        const next = this.appendSet(withExercise, exerciseName, parsed.entry);
        this.sessions.save(chatId, next);
        return next;
    }

    finalize(chatId: number): Workout | null {
        const current = this.sessions.get(chatId);
        if (!current || current.step !== "collecting" || !current.split) return null;

        const workout: Workout = { date: current.date, split: current.split, exercises: current.exercises };
        this.workouts.save(chatId, workout);
        this.sessions.remove(chatId);
        return workout;
    }

    private ensureExercise(list: ReadonlyArray<Exercise>, name: string): ReadonlyArray<Exercise> {
        return list.some((e) => e.name === name) ? list : [...list, { name, sets: [] }];
    }

    private appendSet(session: WorkoutSession, exerciseName: string, entry: SetEntry): WorkoutSession {
        return {
            ...session,
            exercises: session.exercises.map((ex) => (ex.name !== exerciseName ? ex : { ...ex, sets: [...ex.sets, entry] })),
        };
    }
}
