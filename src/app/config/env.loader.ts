import * as fs from 'fs';
import { config } from 'dotenv';

/**
 * Загружает переменные окружения в зависимости от NODE_ENV.
 * Поддерживаемые режимы:
 * - development → .env.dev
 * - production  → .env.prod
 * - docker      → .env.docker
 *
 * Выполняет валидацию существования файла и выводит итоговую конфигурацию.
 */
export function loadEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  let envFile: string;

  switch (nodeEnv) {
    case 'production':
      envFile = '.env.prod';
      break;
    case 'docker':
      envFile = '.env.docker';
      break;
    case 'development':
      envFile = '.env.dev';
      break;
    default:
      console.error(`❌ NODE_ENV "${nodeEnv}" не поддерживается`);
      process.exit(1);
  }

  if (!fs.existsSync(envFile)) {
    console.error(`❌ Файл окружения ${envFile} не найден.`);
    process.exit(1);
  }

  config({ path: envFile });

  import('chalk')
    .then((chalkModule) => {
      const chalk = chalkModule.default;

      console.log(
        chalk.bgBlue.white.bold(`\n ▶ Режим запуска: ${nodeEnv} \n`),
      );

      console.log(
        chalk.greenBright(`🌐 API WEB:`),
        chalk.white(`${process.env.WEB_API}`),
      );

      console.log(
        chalk.greenBright(`🏭 API FACTORIO:`),
        chalk.white(`${process.env.FACTORIO_API}`),
      );
    })
    .catch((error) => {
      console.error(`Не удалось загрузить chalk:`, error);
    });
}
