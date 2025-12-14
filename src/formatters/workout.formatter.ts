import type { ISODate, SetEntry, Workout, WorkoutSession, WorkoutSplit } from "@/domain/workout.types";

export class WorkoutFormatter {
    toCard(session: WorkoutSession): string {
        const lines: string[] = [
            "<b>ТРЕНИРОВКА</b>",
            "",
            `Дата: <b>${this.humanDate(session.date)}</b>`,
            `Тип: <b>${session.split ? this.splitLabel(session.split) : "не выбран"}</b>`,
            "",
        ];

        for (const ex of session.exercises) {
            lines.push(`<b>${this.escape(ex.name)}</b>`);
            for (const s of ex.sets) lines.push(`- ${this.formatSet(s)}`);
            lines.push("");
        }

        if (session.step === "collecting") {
            lines.push(`<i>Текущее упражнение:</i> <b>${this.escape(session.currentExercise ?? "не выбрано")}</b>`);
        }

        return `<blockquote>${lines.join("\n")}</blockquote>`;
    }

    toWorkoutMessage(workout: Workout): string {
        const lines: string[] = [
            "<b>Тренировка</b>",
            `Дата: <b>${this.humanDate(workout.date)}</b>`,
            `Тип: <b>${this.splitLabel(workout.split)}</b>`,
            "",
        ];

        for (const ex of workout.exercises) {
            lines.push(`<b>${this.escape(ex.name)}</b>`);
            for (const s of ex.sets) lines.push(`- ${this.formatSet(s)}`);
            lines.push("");
        }

        return lines.join("\n");
    }

    private formatSet(entry: SetEntry): string {
        if (entry.kind === "raw") return this.escape(entry.raw);

        if (typeof entry.weight === "number" && typeof entry.reps === "number") {
            return `${this.cleanNumber(entry.weight)} × ${entry.reps}`;
        }

        if (typeof entry.sets === "number" && typeof entry.reps === "number") {
            return `${entry.sets} подход(а) по ${entry.reps}`;
        }

        if (entry.note) return this.escape(entry.note);

        return this.escape(entry.raw);
    }

    private cleanNumber(n: number): string {
        const s = String(n);
        return s.includes(".") ? s.replace(/\.0+$/, "") : s;
    }

    private humanDate(iso: ISODate): string {
        const [y, m, d] = iso.split("-").map(Number);
        return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
    }

    private splitLabel(split: WorkoutSplit): string {
        switch (split) {
            case "upper":
                return "Верх";
            case "lower":
                return "Низ";
            case "push":
                return "Push";
            case "pull":
                return "Pull";
            case "legs":
                return "Ноги";
            case "full":
                return "Full body";
            case "cardio":
                return "Кардио";
            case "other":
                return "Другое";
        }
    }

    private escape(value: string): string {
        return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }
}
