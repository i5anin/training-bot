import type {
  ISODate,
  SetEntry,
  Workout,
  WorkoutSession,
  WorkoutSplit,
} from '@/domain/workout.types';

/**
 * Форматтер доменных объектов тренировки в HTML-строки для Telegram (parse_mode=HTML).
 *
 * Ответственность:
 * - построение карточки текущей сессии (WorkoutSession)
 * - построение итогового сообщения тренировки (Workout)
 * - безопасное экранирование пользовательского ввода для HTML
 */
export class WorkoutFormatter {
  /**
   * Формирует HTML-карточку текущей сессии тренировки.
   *
   * Вывод предназначен для Telegram в режиме parse_mode=HTML
   * и оборачивается в <blockquote>.
   *
   * @param {WorkoutSession} session Текущая сессия тренировки
   * @returns {string} HTML-строка карточки
   */
  toCard(session: WorkoutSession): string {
    const lines: string[] = [
      '<b>ТРЕНИРОВКА</b>',
      '',
      `Дата: <b>${this.humanDate(session.date)}</b>`,
      `Тип: <b>${session.split ? this.splitLabel(session.split) : 'не выбран'}</b>`,
      '',
    ];

    for (const ex of session.exercises) {
      lines.push(`<b>${this.escape(ex.name)}</b>`);
      for (const s of ex.sets) lines.push(`- ${this.formatSet(s)}`);
      lines.push('');
    }

    if (session.step === 'collecting') {
      lines.push(
        `<i>Текущее упражнение:</i> <b>${this.escape(session.currentExercise ?? 'не выбрано')}</b>`,
      );
    }

    return `<blockquote>${lines.join('\n')}</blockquote>`;
  }

  /**
   * Формирует итоговое HTML-сообщение тренировки для отправки в чат.
   *
   * Вывод предназначен для Telegram в режиме parse_mode=HTML.
   *
   * @param {Workout} workout Итоговая тренировка
   * @returns {string} HTML-строка сообщения
   */
  toWorkoutMessage(workout: Workout): string {
    const lines: string[] = [
      '<b>Тренировка</b>',
      `Дата: <b>${this.humanDate(workout.date)}</b>`,
      `Тип: <b>${this.splitLabel(workout.split)}</b>`,
      '',
    ];

    for (const ex of workout.exercises) {
      lines.push(`<b>${this.escape(ex.name)}</b>`);
      for (const s of ex.sets) lines.push(`- ${this.formatSet(s)}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Форматирует один элемент подхода/записи (SetEntry) в человекочитаемую строку.
   *
   * Правила:
   * - raw: возвращает исходный текст (экранированный)
   * - weight+reps: "вес × повторы"
   * - sets+reps: "N подход(а) по M"
   * - note: примечание (экранированное)
   * - fallback: raw (экранированный)
   *
   * @param {SetEntry} entry Запись подхода
   * @returns {string} HTML-безопасная строка
   */
  private formatSet(entry: SetEntry): string {
    if (entry.kind === 'raw') return this.escape(entry.raw);

    if (typeof entry.weight === 'number' && typeof entry.reps === 'number') {
      return `${this.cleanNumber(entry.weight)} × ${entry.reps}`;
    }

    if (typeof entry.sets === 'number' && typeof entry.reps === 'number') {
      return `${entry.sets} подход(а) по ${entry.reps}`;
    }

    if (entry.note) return this.escape(entry.note);

    return this.escape(entry.raw);
  }

  /**
   * Нормализует строковое представление числа веса:
   * - убирает хвост вида ".0", ".00" и т.п.
   *
   * @param {number} n Число для форматирования
   * @returns {string} Нормализованная строка
   */
  private cleanNumber(n: number): string {
    const s = String(n);
    return s.includes('.') ? s.replace(/\.0+$/, '') : s;
  }

  /**
   * Конвертирует ISO-дату (YYYY-MM-DD) в формат DD.MM.YYYY.
   *
   * @param {ISODate} iso Дата в ISO-формате
   * @returns {string} Дата в формате DD.MM.YYYY
   */
  private humanDate(iso: ISODate): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
  }

  /**
   * Возвращает человекочитаемую метку для типа тренировки (WorkoutSplit).
   *
   * @param {WorkoutSplit} split Тип тренировки
   * @returns {string} Локализованная метка
   */
  private splitLabel(split: WorkoutSplit): string {
    switch (split) {
      case 'back_traps':
        return 'Спина / Шраги';
      case 'chest_calves':
        return 'Грудь / Икры';
      case 'deadlift':
        return 'Становая';
      case 'shoulders_abs':
        return 'Плечи / Пресс';
      case 'legs':
        return 'Ноги';
      case 'arms':
        return 'Руки';
    }
  }

  /**
   * Экранирует пользовательский текст для безопасной вставки в HTML Telegram.
   *
   * @param {string} value Произвольная строка
   * @returns {string} Строка с заменой &, <, >
   */
  private escape(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
