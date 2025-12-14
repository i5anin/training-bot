import { InlineKeyboard } from "grammy";
import type { WorkoutSplit } from "@/domain/workout.types";

export const SplitCallbackPrefix = "split:" as const;

export function splitKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("Верх", `${SplitCallbackPrefix}upper`)
        .text("Низ", `${SplitCallbackPrefix}lower`)
        .row()
        .text("Push", `${SplitCallbackPrefix}push`)
        .text("Pull", `${SplitCallbackPrefix}pull`)
        .row()
        .text("Ноги", `${SplitCallbackPrefix}legs`)
        .text("Full body", `${SplitCallbackPrefix}full`)
        .row()
        .text("Кардио", `${SplitCallbackPrefix}cardio`)
        .text("Другое", `${SplitCallbackPrefix}other`);
}

export function controlKeyboard(): InlineKeyboard {
    return new InlineKeyboard().text("Готово", "workout:done").text("Отменить", "workout:cancel");
}

export function isSplitCallback(data: string): data is `${typeof SplitCallbackPrefix}${WorkoutSplit}` {
    return data.startsWith(SplitCallbackPrefix);
}

export function parseSplitCallback(data: `${typeof SplitCallbackPrefix}${WorkoutSplit}`): WorkoutSplit {
    return data.slice(SplitCallbackPrefix.length) as WorkoutSplit;
}
