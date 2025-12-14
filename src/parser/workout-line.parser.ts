import type { SetEntry } from '@/domain/workout.types';

/**
 * Результат разбора пользовательской строки ввода.
 *
 * - exercise: строка распознана как название упражнения
 * - set: строка распознана как запись подхода/заметка/сырой ввод
 */
export type ParsedLine =
  | Readonly<{ kind: 'exercise'; name: string }>
  | Readonly<{ kind: 'set'; entry: SetEntry }>;

/**
 * Парсер строк пользовательского ввода для тренировки.
 *
 * Ответственность:
 * - определять, является ли строка названием упражнения или записью подхода
 * - распознавать распространённые форматы ввода:
 *   - "7.5x20" / "7,5х20" / "7.5 × 20"
 *   - "54 на 15"
 *   - "4 подхода по 12"
 *   - "4 12" (без букв)
 * - нормализовать имя упражнения
 * - конвертировать вес в число с учётом "," и "."
 */
export class WorkoutLineParser {
  /**
   * Разбирает строку и возвращает доменно-ориентированное представление.
   *
   * Правила (в порядке применения):
   * 1) пустая/пробельная строка → set(raw) с исходным текстом
   * 2) буквы без цифр → exercise(name)
   * 3) "вес x повторы" → set(parsed: weight+reps)
   * 4) "вес на повторы" → set(parsed: weight+reps)
   * 5) "подходы по повторы" → set(parsed: sets+reps)
   * 6) "A B" (две группы цифр, без букв) → set(parsed: sets+reps)
   * 7) буквы + цифры → set(parsed: note)
   * 8) иначе → set(raw)
   *
   * @param {string} text Пользовательский ввод
   * @returns {ParsedLine} Распознанная структура строки
   */
  parse(text: string): ParsedLine {
    const trimmed = text.trim();
    if (!trimmed) return { kind: 'set', entry: { kind: 'raw', raw: text } };

    const hasLetters = /[A-Za-zА-Яа-яЁё]/.test(trimmed);
    const hasDigits = /\d/.test(trimmed);

    if (hasLetters && !hasDigits) {
      return { kind: 'exercise', name: this.normalizeExerciseName(trimmed) };
    }

    const mWxR = trimmed.match(/(?<w>\d+(?:[.,]\d+)?)\s*[xх×]\s*(?<r>\d+)\b/u);
    if (mWxR?.groups) {
      return {
        kind: 'set',
        entry: {
          kind: 'parsed',
          weight: this.toNumber(mWxR.groups.w),
          reps: Number(mWxR.groups.r),
          raw: trimmed,
        },
      };
    }

    const mWnaR = trimmed.match(
      /(?<w>\d+(?:[.,]\d+)?)\s*(?:на)\s*(?<r>\d+)\b/u,
    );
    if (mWnaR?.groups) {
      return {
        kind: 'set',
        entry: {
          kind: 'parsed',
          weight: this.toNumber(mWnaR.groups.w),
          reps: Number(mWnaR.groups.r),
          raw: trimmed,
        },
      };
    }

    const mSetsReps = trimmed.match(
      /(?<s>\d+)\s*(?:подход[а-я]*)\s*(?:по)\s*(?<r>\d+)\b/u,
    );
    if (mSetsReps?.groups) {
      return {
        kind: 'set',
        entry: {
          kind: 'parsed',
          sets: Number(mSetsReps.groups.s),
          reps: Number(mSetsReps.groups.r),
          raw: trimmed,
        },
      };
    }

    const mTwoNums = trimmed.match(/^(?<a>\d+)\s+(?<b>\d+)\b/u);
    if (mTwoNums?.groups && !hasLetters) {
      return {
        kind: 'set',
        entry: {
          kind: 'parsed',
          sets: Number(mTwoNums.groups.a),
          reps: Number(mTwoNums.groups.b),
          raw: trimmed,
        },
      };
    }

    if (hasLetters && hasDigits) {
      return {
        kind: 'set',
        entry: { kind: 'parsed', note: trimmed, raw: trimmed },
      };
    }

    return { kind: 'set', entry: { kind: 'raw', raw: trimmed } };
  }

  /**
   * Нормализует название упражнения:
   * - схлопывает повторяющиеся пробелы
   * - убирает пробелы по краям
   *
   * @param {string} value Название упражнения
   * @returns {string} Нормализованное название
   */
  private normalizeExerciseName(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  /**
   * Преобразует строковое число к number, поддерживая "," как десятичный разделитель.
   *
   * @param {string} value Строковое число (например "7,5" или "7.5")
   * @returns {number} Число
   */
  private toNumber(value: string): number {
    return Number(value.replace(',', '.'));
  }
}
