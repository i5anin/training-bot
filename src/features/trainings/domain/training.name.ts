import { z } from "zod";

export const TrainingNameSchema = z
    .string()
    .trim()
    .min(1)
    .max(80);

export type TrainingName = z.infer<typeof TrainingNameSchema>;

export function parseTrainingName(raw: unknown): TrainingName {
    return TrainingNameSchema.parse(raw);
}
