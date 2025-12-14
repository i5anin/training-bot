import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { registerCommands } from '@/commands/workout.commands';

/**
 * Сервис управления жизненным циклом Telegram-бота.
 *
 * Отвечает за:
 * - инициализацию экземпляра grammy Bot
 * - регистрацию команд
 * - запуск и остановку polling в рамках жизненного цикла NestJS
 */
@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly bot: Bot<Context>;
  private launchTimestamp?: Date;

  /**
   * Создаёт и инициализирует экземпляр сервиса бота.
   *
   * Проверяет наличие BOT_TOKEN в переменных окружения
   * и создаёт экземпляр grammy Bot.
   *
   * @throws {Error} Если BOT_TOKEN отсутствует
   */
  constructor() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      throw new Error('BOT_TOKEN не найден в переменных окружения');
    }

    this.bot = new Bot<Context>(token);
  }

  /**
   * Запускает бота при инициализации NestJS-модуля.
   *
   * Регистрирует команды, фиксирует момент запуска
   * и запускает polling Telegram API.
   *
   * @returns {Promise<void>}
   */
  async onModuleInit(): Promise<void> {
    this.launchTimestamp = new Date();

    await registerCommands(this.bot);

    const launchedAt = this.launchTimestamp.toISOString();

    await this.bot.start({
      /**
       * Callback, вызываемый grammy после успешного запуска бота.
       *
       * Используется для логирования информации
       * о запущенном экземпляре бота.
       *
       * @param botInfo Информация о боте от Telegram API
       */
      onStart: (botInfo) => {
        console.log(
          `Бот запущен. launchedAt=${launchedAt}, username=@${botInfo.username}`,
        );
      },
    });
  }

  /**
   * Останавливает бота при уничтожении NestJS-модуля.
   *
   * Корректно завершает polling и освобождает ресурсы.
   *
   * @returns {Promise<void>}
   */
  async onModuleDestroy(): Promise<void> {
    await this.bot.stop();
  }
}
