import type { Bot, Context } from 'grammy';
import type { ISODate, WorkoutSession } from '@/domain/workout.types';
import { InMemoryWorkoutRepository } from '@/repositories/in-memory/in-memory-workout.repository';
import { InMemoryWorkoutSessionRepository } from '@/repositories/in-memory/in-memory-workout-session.repository';
import { WorkoutLineParser } from '@/parser/workout-line.parser';
import { WorkoutFormatter } from '@/formatters/workout.formatter';
import { WorkoutSessionService } from '@/services/workout-session.service';
import {
  controlKeyboard,
  isSplitCallback,
  parseSplitCallback,
  splitKeyboard,
} from '@/ui/workout.keyboards';

const managerChatId = Number(process.env.MANAGER_CHAT_ID);

/**
 * Извлекает числовой идентификатор чата из контекста Telegram.
 *
 * @param {Context} ctx Контекст grammy
 * @returns {number | null} ID чата или null, если чат недоступен/нечисловой
 */
function getChatId(ctx: Context): number | null {
  const id = ctx.chat?.id;
  return typeof id === 'number' ? id : null;
}

/**
 * Возвращает текущую дату в формате ISO (YYYY-MM-DD).
 *
 * @returns {ISODate} Текущая дата в формате ISO
 */
function todayIso(): ISODate {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Парсит аргумент команды с датой в формате DD.MM.YYYY и конвертирует в ISO (YYYY-MM-DD).
 *
 * @param {string} arg Аргумент команды
 * @returns {ISODate | null} Дата в ISO-формате или null при невалидном формате
 */
function parseDateCommand(arg: string): ISODate | null {
  const trimmed = arg.trim();
  const m = trimmed.match(/^(?<d>\d{2})\.(?<m>\d{2})\.(?<y>\d{4})$/);
  if (!m?.groups) return null;
  return `${m.groups.y}-${m.groups.m}-${m.groups.d}`;
}

/**
 * Безопасно обновляет "карточку" активной тренировки (сообщение с состоянием).
 *
 * Поведение:
 * - если cardMessageId отсутствует — ничего не делает
 * - игнорирует ошибки редактирования сообщения (например, сообщение удалено/нельзя редактировать)
 *
 * @param {Context} ctx Контекст grammy
 * @param {number} chatId ID чата
 * @param {WorkoutSession} session Активная сессия тренировки
 * @param {string} html HTML-разметка карточки
 * @returns {Promise<void>}
 */
async function safeEditCard(
  ctx: Context,
  chatId: number,
  session: WorkoutSession,
  html: string,
): Promise<void> {
  if (!session.cardMessageId) return;
  try {
    await ctx.api.editMessageText(chatId, session.cardMessageId, html, {
      parse_mode: 'HTML',
      reply_markup: controlKeyboard(),
    });
  } catch {
    // no-op
  }
}

/**
 * Регистрирует команды и обработчики сообщений/колбэков для бота.
 *
 * Инкапсулирует wiring (связывание) доменной логики с Telegram UI:
 * - старт/ведение сессии тренировки
 * - установка даты
 * - ввод строк упражнений/подходов
 * - завершение/отмена и отправка итогового сообщения
 * - обработка inline-клавиатур (выбор split, done, cancel)
 *
 * @param {Bot<Context>} bot Экземпляр grammy Bot
 * @returns {Promise<void>}
 */
export async function registerCommands(bot: Bot<Context>): Promise<void> {
  const sessions = new InMemoryWorkoutSessionRepository();
  const workouts = new InMemoryWorkoutRepository();
  const parser = new WorkoutLineParser();
  const service = new WorkoutSessionService(sessions, workouts, parser);
  const formatter = new WorkoutFormatter();

  bot.command('w', async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const arg = ctx.match?.toString() ?? '';
    const date = arg ? parseDateCommand(arg) : todayIso();
    if (arg && !date) {
      await ctx.reply('<b>Неверная дата</b>\n<i>Формат: /w 04.12.2025</i>', {
        parse_mode: 'HTML',
      });
      return;
    }

    const session = service.start(chatId, date ?? todayIso());

    const card = await ctx.reply(formatter.toCard(session), {
      parse_mode: 'HTML',
      reply_markup: splitKeyboard(),
    });

    service.setCardMessageId(chatId, card.message_id);
    await ctx.reply('<b>Выберите тип тренировки</b>', { parse_mode: 'HTML' });
  });

  bot.command('date', async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const session = service.get(chatId);
    if (!session) {
      await ctx.reply('<b>Нет активной тренировки</b>\n<i>Начните: /w</i>', {
        parse_mode: 'HTML',
      });
      return;
    }

    const arg = ctx.match?.toString() ?? '';
    const date = parseDateCommand(arg);
    if (!date) {
      await ctx.reply('<b>Неверная дата</b>\n<i>Формат: /date 04.12.2025</i>', {
        parse_mode: 'HTML',
      });
      return;
    }

    const next: WorkoutSession = { ...session, date };
    sessions.save(chatId, next);
    await safeEditCard(ctx, chatId, next, formatter.toCard(next));
  });

  bot.command('done', async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const workout = service.finalize(chatId);
    if (!workout) {
      await ctx.reply('<b>Нечего завершать</b>\n<i>Начните: /w</i>', {
        parse_mode: 'HTML',
      });
      return;
    }

    const message = formatter.toWorkoutMessage(workout);
    await ctx.reply(message, { parse_mode: 'HTML' });

    if (Number.isFinite(managerChatId)) {
      try {
        await ctx.api.sendMessage(managerChatId as number, message, {
          parse_mode: 'HTML',
        });
      } catch {
        // no-op
      }
    }
  });

  bot.command('cancel', async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const had = service.get(chatId);
    service.cancel(chatId);

    await ctx.reply(
      had ? '<b>Тренировка отменена</b>' : '<b>Нет активной тренировки</b>',
      { parse_mode: 'HTML' },
    );
  });

  bot.callbackQuery(/.*/, async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) {
      await ctx.answerCallbackQuery();
      return;
    }

    const data = ctx.callbackQuery.data;

    if (data === 'workout:done') {
      const workout = service.finalize(chatId);
      if (!workout) {
        await ctx.answerCallbackQuery({
          text: 'Нечего завершать',
          show_alert: false,
        });
        return;
      }

      const message = formatter.toWorkoutMessage(workout);
      await ctx
        .editMessageReplyMarkup({ reply_markup: undefined })
        .catch(() => undefined);
      await ctx.reply(message, { parse_mode: 'HTML' });

      if (Number.isFinite(managerChatId)) {
        try {
          await ctx.api.sendMessage(managerChatId as number, message, {
            parse_mode: 'HTML',
          });
        } catch {
          // no-op
        }
      }

      await ctx.answerCallbackQuery({ text: 'Сохранено', show_alert: false });
      return;
    }

    if (data === 'workout:cancel') {
      service.cancel(chatId);
      await ctx.editMessageText('<b>Тренировка отменена</b>', {
        parse_mode: 'HTML',
      });
      await ctx.answerCallbackQuery({ text: 'Отменено', show_alert: false });
      return;
    }

    if (isSplitCallback(data)) {
      const split = parseSplitCallback(data);
      const session = service.chooseSplit(chatId, split);

      if (!session) {
        await ctx.answerCallbackQuery({
          text: 'Нет активной тренировки',
          show_alert: false,
        });
        return;
      }

      await safeEditCard(ctx, chatId, session, formatter.toCard(session));
      await ctx.answerCallbackQuery({ text: 'Тип выбран', show_alert: false });

      await ctx.reply(
        '<b>Ввод:</b>\n' +
          '1) название упражнения (сообщение без цифр)\n' +
          '2) подходи: <code>7.5х20</code>, <code>54 на 15</code>, <code>4 подхода по 12</code>\n\n' +
          '<i>Завершить: /done</i>',
        { parse_mode: 'HTML' },
      );
      return;
    }

    await ctx.answerCallbackQuery();
  });

  bot.on('message:text', async (ctx) => {
    const chatId = getChatId(ctx);
    if (!chatId) return;

    const session = service.get(chatId);
    if (!session || session.step !== 'collecting') return;

    const text = (ctx.message.text ?? '').trim();
    if (!text) return;

    const next = service.addLine(chatId, text);
    if (!next) return;

    await safeEditCard(ctx, chatId, next, formatter.toCard(next));
  });
}
