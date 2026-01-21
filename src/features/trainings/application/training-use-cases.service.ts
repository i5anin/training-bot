import { Injectable } from "@nestjs/common";
import { TrainingRepository } from "../infrastructure/training.repository";
import { TrainingName } from "../domain/training.name";
import { TrainingEntity } from "../domain/training.entity";

@Injectable()
export class TrainingUseCasesService {
    constructor(private readonly repo: TrainingRepository) {}

    listTrainings(): Promise<TrainingEntity[]> {
        return this.repo.list();
    }

    addTrainingCount(name: TrainingName, delta: number): Promise<TrainingEntity> {
        return this.repo.upsertByName(name, delta);
    }
}
