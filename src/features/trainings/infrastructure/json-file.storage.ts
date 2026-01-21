import { Injectable } from "@nestjs/common";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import {loadEnv} from "@/app/config/env.loader";


@Injectable()
export class JsonFileStorage {
    private readonly baseDir: string;

    constructor() {
        const env = loadEnv(process.env);
        this.baseDir = env.DATA_DIR;
    }

    async ensureDir(): Promise<void> {
        await fs.mkdir(this.baseDir, { recursive: true });
    }

    resolve(fileName: string): string {
        return path.resolve(this.baseDir, fileName);
    }

    async readJson<T>(fileName: string, fallback: T): Promise<T> {
        await this.ensureDir();
        const filePath = this.resolve(fileName);

        try {
            const raw = await fs.readFile(filePath, "utf8");
            return JSON.parse(raw) as T;
        } catch (e: unknown) {
            const code = (e as { code?: string } | undefined)?.code;
            if (code === "ENOENT") return fallback;
            throw e;
        }
    }

    async writeJsonAtomic<T>(fileName: string, value: T): Promise<void> {
        await this.ensureDir();
        const filePath = this.resolve(fileName);
        const tmpPath = `${filePath}.tmp`;

        const payload = JSON.stringify(value, null, 2);

        await fs.writeFile(tmpPath, payload, "utf8");
        await fs.rename(tmpPath, filePath);
    }
}
