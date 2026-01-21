import { Injectable } from "@nestjs/common";
import { parseTrainingName } from "../domain/training.name";
import { parseCountDeltaFromText } from "../domain/training.count";
import { TrainingUseCasesService } from "./training-use-cases.service";

export type FlowResult =
    | { kind: "askCount"; text: string }
    | { kind: "saved"; text: string }
    | { kind: "invalidCount"; text: string };

@Injectable()
export class TrainingFlowService {
    constructor(private readonly useCases: TrainingUseCasesService) {}

    startByName(rawText: string): { name: string; result: FlowResult } {
        const name = parseTrainingName(rawText);
        return {
            name,
            result: {
                kind: "askCount",
                text: `Ок. Сколько раз для «${name}»? Введите целое число.`,
            },
        };
    }

    async submitCount(name: string, rawText: string): Promise<FlowResult> {
        try {
            const delta = parseCountDeltaFromText(rawText);
            const updated = await this.useCases.addTrainingCount(parseTrainingName(name), delta);
            return {
                kind: "saved",
                text: `Готово: «${updated.name}» +${delta} (итого: ${updated.count}).`,
            };
        } catch {
            return {
                kind: "invalidCount",
                text: "Нужно целое положительное число. Попробуйте ещё раз.",
            };
        }
    }
}
