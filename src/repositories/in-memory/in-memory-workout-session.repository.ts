import type { WorkoutSession } from '@/domain/workout.types';
import type { WorkoutSessionRepository } from '../workout-session.repository';

/**
 * In-memory реализация репозитория сессий тренировок.
 *
 * Ответственность:
 * - хранение активной сессии тренировки на чат
 * - предоставление операций чтения, сохранения и удаления
 *
 * Используется для:
 * - локального запуска
 * - разработки
 * - тестирования
 *
 * Данные хранятся в памяти процесса и теряются при перезапуске.
 */
export class InMemoryWorkoutSessionRepository
  implements WorkoutSessionRepository
{
  /**
   * Хранилище активных сессий.
   *
   * Ключ: идентификатор чата
   * Значение: текущая сессия тренировки
   */
  private readonly map = new Map<number, WorkoutSession>();

  /**
   * Возвращает активную сессию тренировки для указанного чата.
   *
   * @param {number} chatId Идентификатор чата
   * @returns {WorkoutSession | null} Сессия или null, если отсутствует
   */
  get(chatId: number): WorkoutSession | null {
    return this.map.get(chatId) ?? null;
  }

  /**
   * Сохраняет или обновляет сессию тренировки для чата.
   *
   * @param {number} chatId Идентификатор чата
   * @param {WorkoutSession} session Сессия тренировки
   * @returns {void}
   */
  save(chatId: number, session: WorkoutSession): void {
    this.map.set(chatId, session);
  }

  /**
   * Удаляет активную сессию тренировки для указанного чата.
   *
   * @param {number} chatId Идентификатор чата
   * @returns {void}
   */
  remove(chatId: number): void {
    this.map.delete(chatId);
  }
}
