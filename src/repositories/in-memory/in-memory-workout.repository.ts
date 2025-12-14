import type { Workout } from '@/domain/workout.types';
import type { WorkoutRepository } from '../workout.repository';

/**
 * In-memory реализация репозитория тренировок.
 *
 * Ответственность:
 * - хранение завершённых тренировок в оперативной памяти
 * - изоляция механизма хранения от доменной логики
 *
 * Предназначение:
 * - локальное использование
 * - разработка и тестирование
 * - не гарантирует сохранность данных между перезапусками процесса
 */
export class InMemoryWorkoutRepository implements WorkoutRepository {
  /**
   * Хранилище тренировок, сгруппированных по chatId.
   *
   * Ключ: идентификатор чата
   * Значение: список завершённых тренировок
   */
  private readonly map = new Map<number, Workout[]>();

  /**
   * Сохраняет тренировку для указанного чата.
   *
   * Поведение:
   * - добавляет тренировку в конец списка
   * - не мутирует ранее сохранённые массивы
   *
   * @param {number} chatId Идентификатор чата
   * @param {Workout} workout Завершённая тренировка
   * @returns {void}
   */
  save(chatId: number, workout: Workout): void {
    const list = this.map.get(chatId) ?? [];
    this.map.set(chatId, [...list, workout]);
  }
}
