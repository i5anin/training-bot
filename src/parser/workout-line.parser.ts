import type { SetEntry } from "@/domain/workout.types";

export type ParsedLine =
    | Readonly<{ kind: "exercise"; name: string }>
    | Readonly<{ kind: "set"; entry: SetEntry }>;

export class WorkoutLineParser {
    parse(text: string): ParsedLine {
        const trimmed = text.trim();
        if (!trimmed) return { kind: "set", entry: { kind: "raw", raw: text } };

        const hasLetters = /[A-Za-zА-Яа-яЁё]/.test(trimmed);
        const hasDigits = /\d/.test(trimmed);

        if (hasLetters && !hasDigits) {
            return { kind: "exercise", name: this.normalizeExerciseName(trimmed) };
        }

        const mWxR = trimmed.match(/(?<w>\d+(?:[.,]\d+)?)\s*[xх×]\s*(?<r>\d+)\b/u);
        if (mWxR?.groups) {
            return {
                kind: "set",
                entry: { kind: "parsed", weight: this.toNumber(mWxR.groups.w), reps: Number(mWxR.groups.r), raw: trimmed },
            };
        }

        const mWnaR = trimmed.match(/(?<w>\d+(?:[.,]\d+)?)\s*(?:на)\s*(?<r>\d+)\b/u);
        if (mWnaR?.groups) {
            return {
                kind: "set",
                entry: { kind: "parsed", weight: this.toNumber(mWnaR.groups.w), reps: Number(mWnaR.groups.r), raw: trimmed },
            };
        }

        const mSetsReps = trimmed.match(/(?<s>\d+)\s*(?:подход[а-я]*)\s*(?:по)\s*(?<r>\d+)\b/u);
        if (mSetsReps?.groups) {
            return {
                kind: "set",
                entry: { kind: "parsed", sets: Number(mSetsReps.groups.s), reps: Number(mSetsReps.groups.r), raw: trimmed },
            };
        }

        const mTwoNums = trimmed.match(/^(?<a>\d+)\s+(?<b>\d+)\b/u);
        if (mTwoNums?.groups && !hasLetters) {
            return {
                kind: "set",
                entry: { kind: "parsed", sets: Number(mTwoNums.groups.a), reps: Number(mTwoNums.groups.b), raw: trimmed },
            };
        }

        if (hasLetters && hasDigits) {
            return { kind: "set", entry: { kind: "parsed", note: trimmed, raw: trimmed } };
        }

        return { kind: "set", entry: { kind: "raw", raw: trimmed } };
    }

    private normalizeExerciseName(value: string): string {
        return value.replace(/\s+/g, " ").trim();
    }

    private toNumber(value: string): number {
        return Number(value.replace(",", "."));
    }
}
