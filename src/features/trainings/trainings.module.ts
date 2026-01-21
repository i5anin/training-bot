import { Module } from "@nestjs/common";
import { TrainingsUpdateHandler } from "@/features/trainings/presentation/trainings.update-handler";
import { TrainingFlowService } from "@/features/trainings/application/training-flow.service";
import { TrainingUseCasesService } from "@/features/trainings/application/training-use-cases.service";
import { TrainingRepository } from "@/features/trainings/infrastructure/training.repository";
import { JsonFileStorage } from "@/features/trainings/infrastructure/json-file.storage";

@Module({
    providers: [
        TrainingsUpdateHandler,
        TrainingFlowService,
        TrainingUseCasesService,
        TrainingRepository,
        JsonFileStorage,
    ],
    exports: [TrainingsUpdateHandler],
})
export class TrainingsModule {}
