import { Injectable } from "@nestjs/common";
import { Bot } from "grammy";

import { TrainingFlowService } from "@/features/trainings/application/training-flow.service";
import { BotContext } from "@/app/bot/bot.provider";
import { TrainingUseCasesService } from "@/features/trainings/application/training-use-cases.service";

@Injectable()
export class TrainingsUpdateHandler {
    constructor(
        private readonly flow: TrainingFlowService,
        private readonly useCases: TrainingUseCasesService,
    ) {}

    register(bot: Bot<BotContext>): void {
        bot.command("list", async (ctx) => {
            const items = await this.useCases.listTrainings();
            if (items.length === 0) {
                await ctx.reply("Список пуст. Отправьте название тренировки текстом, чтобы добавить.");
                return;
            }
            const lines = items.map((x, i) => `${i + 1}. ${x.name} — ${x.count}`);
            await ctx.reply(lines.join("\n"));
        });

        bot.command("cancel", async (ctx) => {
            ctx.session.training = { kind: "idle" };
            await ctx.reply("Ок. Действие отменено.");
        });

        bot.on("message:text", async (ctx) => {
            const text = ctx.message.text.trim();
            if (text.startsWith("/")) return;

            const state = ctx.session.training;

            if (state.kind === "awaitingCount") {
                const res = await this.flow.submitCount(state.name, text);

                if (res.kind === "saved") {
                    ctx.session.training = { kind: "idle" };
                }

                await ctx.reply(res.text);
                return;
            }

            const started = this.flow.startByName(text);
            ctx.session.training = { kind: "awaitingCount", name: started.name };
            await ctx.reply(started.result.text);
        });
    }
}
