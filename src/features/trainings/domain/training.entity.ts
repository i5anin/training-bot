import { TrainingName } from "./training.name";

export type TrainingId = string;

export type TrainingEntity = Readonly<{
    id: TrainingId;
    name: TrainingName;
    count: number;
    createdAt: string;
    updatedAt: string;
}>;
