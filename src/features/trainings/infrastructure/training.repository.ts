import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { JsonFileStorage } from "./json-file.storage";
import { TrainingEntity } from "../domain/training.entity";
import { TrainingName } from "../domain/training.name";

type TrainingsDb = Readonly<{
    version: 1;
    items: TrainingEntity[];
}>;

const DB_FILE = "trainings.json";

@Injectable()
export class TrainingRepository {
    constructor(private readonly storage: JsonFileStorage) {}

    async list(): Promise<TrainingEntity[]> {
        const db = await this.storage.readJson<TrainingsDb>(DB_FILE, { version: 1, items: [] });
        return db.items
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    async upsertByName(name: TrainingName, delta: number): Promise<TrainingEntity> {
        const db = await this.storage.readJson<TrainingsDb>(DB_FILE, { version: 1, items: [] });

        const now = new Date().toISOString();
        const idx = db.items.findIndex((x) => x.name.toLowerCase() === name.toLowerCase());

        let updated: TrainingEntity;

        if (idx >= 0) {
            const existing = db.items[idx];
            updated = {
                ...existing,
                count: existing.count + delta,
                updatedAt: now,
            };
            const nextItems = db.items.slice();
            nextItems[idx] = updated;
            await this.storage.writeJsonAtomic(DB_FILE, { version: 1, items: nextItems });
            return updated;
        }

        updated = {
            id: randomUUID(),
            name,
            count: delta,
            createdAt: now,
            updatedAt: now,
        };

        await this.storage.writeJsonAtomic(DB_FILE, { version: 1, items: [...db.items, updated] });
        return updated;
    }
}
