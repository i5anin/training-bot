import './shared/config/env';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { colorize, tColor } from '@/shared/utils/colorize';
import { loadEnv } from '@/app/config/env.loader';

loadEnv();

/**
 * Точка входа приложения.
 *
 * Загружает конфигурацию окружения, инициализирует NestJS-приложение
 * с главным модулем и запускает HTTP-сервер.
 *
 * В процессе запуска выводит диагностическую информацию
 * о текущем окружении и статусе аутентификации бота.
 *
 * @returns {Promise<void>}
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  console.log(
    `${colorize('[ENV]', tColor.c)} NODE_ENV: ${colorize(
      process.env.NODE_ENV ?? 'undefined',
      tColor.y,
    )}`,
  );

  console.log(
    `${colorize('[AUTH]', tColor.m)} TOKEN: ${process.env.BOT_TOKEN?.slice(0, 8)}...`,
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Ошибка запуска приложения', err);
  process.exit(1);
});
