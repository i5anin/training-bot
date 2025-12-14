import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BotModule } from '@/app/bot/bot.module';

/**
 * Корневой модуль приложения.
 *
 * Ответственность:
 * - загрузка и инициализация конфигурации окружения
 * - агрегация доменных модулей приложения
 *
 * Конфигурация:
 * - ConfigModule подключён глобально и доступен во всех модулях
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BotModule,
  ],
})
export class AppModule {}
