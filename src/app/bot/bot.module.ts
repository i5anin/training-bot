import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotService } from './bot.service';
/**
 * Модуль Telegram-бота.
 *
 * Ответственность:
 * - инкапсуляция логики бота
 * - предоставление BotService другим модулям
 *
 * Зависимости:
 * - ConfigModule для доступа к переменным окружения
 */
@Module({
  imports: [ConfigModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
