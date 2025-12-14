import { InlineKeyboard } from 'grammy';
import type { WorkoutSplit } from '@/domain/workout.types';

export const SplitCallbackPrefix = 'split:' as const;

/**
 * Строит inline-клавиатуру выбора типа тренировки (WorkoutSplit).
 *
 * Ответственность:
 * - предоставление UI для выбора сплита
 * - кодирование выбранного значения в callback_data
 *
 * Каждая кнопка использует единый префикс SplitCallbackPrefix
 * для надёжной фильтрации callback-запросов.
 *
 * @returns {InlineKeyboard} Inline-клавиатура выбора сплита
 */
export function splitKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('1. Спина', `${SplitCallbackPrefix}back_traps`)
    .text('Шраги', `${SplitCallbackPrefix}back_traps`)
    .row()
    .text('2. Грудь', `${SplitCallbackPrefix}chest_calves`)
    .text('Икры', `${SplitCallbackPrefix}chest_calves`)
    .row()
    .text('3. Становая', `${SplitCallbackPrefix}deadlift`)
    .row()
    .text('4. Плечи', `${SplitCallbackPrefix}shoulders_abs`)
    .text('Пресс', `${SplitCallbackPrefix}shoulders_abs`)
    .row()
    .text('5. Ноги верх', `${SplitCallbackPrefix}legs`)
    .text('Ноги низ', `${SplitCallbackPrefix}legs`)
    .row()
    .text('6. Бицепс', `${SplitCallbackPrefix}arms`)
    .text('Трицепс', `${SplitCallbackPrefix}arms`);
}

/**
 * Строит inline-клавиатуру управления активной тренировкой.
 *
 * Назначение:
 * - завершение тренировки
 * - отмена тренировки
 *
 * @returns {InlineKeyboard} Inline-клавиатура управления
 */
export function controlKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Готово', 'workout:done')
    .text('Отменить', 'workout:cancel');
}

/**
 * Проверяет, является ли callback_data выбором сплита тренировки.
 *
 * Используется как type guard для безопасного
 * последующего парсинга значения.
 *
 * @param {string} data callback_data из Telegram
 * @returns {boolean} true, если callback относится к WorkoutSplit
 */
export function isSplitCallback(
  data: string,
): data is `${typeof SplitCallbackPrefix}${WorkoutSplit}` {
  return data.startsWith(SplitCallbackPrefix);
}

/**
 * Извлекает значение WorkoutSplit из callback_data.
 *
 * Предполагает, что строка уже прошла проверку через isSplitCallback.
 *
 * @param {`${typeof SplitCallbackPrefix}${WorkoutSplit}`} data callback_data
 * @returns {WorkoutSplit} Тип тренировки
 */
export function parseSplitCallback(
  data: `${typeof SplitCallbackPrefix}${WorkoutSplit}`,
): WorkoutSplit {
  return data.slice(SplitCallbackPrefix.length) as WorkoutSplit;
}
