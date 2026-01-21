import { z } from "zod";

export const TrainingCountDeltaSchema = z
    .number()
    .int()
    .positive()
    .max(100000);

export type TrainingCountDelta = z.infer<typeof TrainingCountDeltaSchema>;

export function parseCountDeltaFromText(text: string): TrainingCountDelta {
    const normalized = text.trim();
    const n = Number(normalized);
    return TrainingCountDeltaSchema.parse(n);
}
