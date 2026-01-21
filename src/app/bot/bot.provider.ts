import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Bot, Context, session, SessionFlavor } from "grammy";
import { loadEnv } from "../config/env.schema";
import { TrainingsUpdateHandler } from "../features/trainings/presentation/trainings.update-handler";

export type TrainingSessionState =
    | { kind: "idle" }
    | { kind: "awaitingCount"; name: string };

export type BotSession = { training: TrainingSessionState };

export type BotContext = Context & SessionFlavor<BotSession>;

const initialSession = (): BotSession => ({ training: { kind: "idle" } });

@Injectable()
export class BotProvider implements OnModuleInit, OnModuleDestroy {
    private bot!: Bot<BotContext>;

    constructor(
        private readonly trainingsHandler: TrainingsUpdateHandler,
    ) {}

    onModuleInit(): void {
        const env = loadEnv(process.env);

        this.bot = new Bot<BotContext>(env.BOT_TOKEN);

        this.bot.use(session({ initial: initialSession }));

        this.trainingsHandler.register(this.bot);

        void this.bot.start();
    }

    async onModuleDestroy(): Promise<void> {
        await this.bot?.stop();
    }
}
