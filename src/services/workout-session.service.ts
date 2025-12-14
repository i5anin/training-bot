import type {
  Exercise,
  ISODate,
  SetEntry,
  Workout,
  WorkoutSession,
  WorkoutSplit,
} from '@/domain/workout.types';
import type { WorkoutRepository } from '@/repositories/workout.repository';
import type { WorkoutSessionRepository } from '@/repositories/workout-session.repository';
import type { WorkoutLineParser } from '@/parser/workout-line.parser';
import { SPLIT_KEYWORDS } from '@/domain/workout.split-keywords';

/**
 * Детектор типа тренировки (WorkoutSplit) по тексту.
 *
 * Ответственность:
 * - нормализация входной строки
 * - сопоставление по ключевым словам из SPLIT_KEYWORDS
 *
 * Возвращает:
 * - WorkoutSplit при первом совпадении
 * - null при отсутствии совпадений
 */
export class WorkoutSplitDetector {
  /**
   * Определяет тип тренировки по произвольному тексту.
   *
   * Правило сопоставления:
   * - lower-case нормализация
   * - поиск подстроки по любому ключевому слову соответствующего сплита
   *
   * @param {string} text Входной текст
   * @returns {WorkoutSplit | null} Определённый сплит или null
   */
  detect(text: string): WorkoutSplit | null {
    const normalized = text.toLowerCase();

    for (const [split, keywords] of Object.entries(SPLIT_KEYWORDS) as [
      WorkoutSplit,
      readonly string[],
    ][]) {
      if (keywords.some((k) => normalized.includes(k))) {
        return split;
      }
    }

    return null;
  }
}

/**
 * Сервис управления сессией тренировки.
 *
 * Ответственность:
 * - создание/чтение/обновление/удаление текущей сессии по chatId
 * - добавление строк ввода (упражнение или подход)
 * - завершение сессии с формированием итогового Workout и сохранением
 *
 * Примечание:
 * - сервис оперирует неизменяемыми структурами данных (создаёт новые объекты)
 * - хранение состояния делегировано WorkoutSessionRepository
 * - сохранение завершённых тренировок делегировано WorkoutRepository
 */
export class WorkoutSessionService {
  private readonly sessions: WorkoutSessionRepository;
  private readonly workouts: WorkoutRepository;
  private readonly parser: WorkoutLineParser;
  /**
   * Создаёт экземпляр сервиса с зависимостями.
   *
   * @param {WorkoutSessionRepository} sessions Репозиторий активных сессий
   * @param {WorkoutRepository} workouts Репозиторий завершённых тренировок
   * @param {WorkoutLineParser} parser Парсер строк ввода
   */
  constructor(
    sessions: WorkoutSessionRepository,
    workouts: WorkoutRepository,
    parser: WorkoutLineParser,
  ) {
    this.sessions = sessions;
    this.workouts = workouts;
    this.parser = parser;
  }

  /**
   * Создаёт новую сессию тренировки и сохраняет её.
   *
   * Начальное состояние:
   * - step = 'choose_split'
   * - exercises = []
   *
   * @param {number} chatId Идентификатор чата
   * @param {ISODate} date Дата тренировки
   * @returns {WorkoutSession} Созданная сессия
   */
  start(chatId: number, date: ISODate): WorkoutSession {
    const session: WorkoutSession = {
      step: 'choose_split',
      date,
      exercises: [],
    };
    this.sessions.save(chatId, session);
    return session;
  }

  /**
   * Возвращает активную сессию тренировки для чата.
   *
   * @param {number} chatId Идентификатор чата
   * @returns {WorkoutSession | null} Текущая сессия или null
   */
  get(chatId: number): WorkoutSession | null {
    return this.sessions.get(chatId);
  }

  /**
   * Привязывает идентификатор сообщения "карточки" к активной сессии.
   *
   * @param {number} chatId Идентификатор чата
   * @param {number} messageId ID сообщения Telegram, в котором отображается карточка
   * @returns {WorkoutSession | null} Обновлённая сессия или null, если активной сессии нет
   */
  setCardMessageId(chatId: number, messageId: number): WorkoutSession | null {
    const current = this.sessions.get(chatId);
    if (!current) return null;
    const next: WorkoutSession = { ...current, cardMessageId: messageId };
    this.sessions.save(chatId, next);
    return next;
  }

  /**
   * Устанавливает выбранный тип тренировки и переводит сессию в режим сбора данных.
   *
   * @param {number} chatId Идентификатор чата
   * @param {WorkoutSplit} split Выбранный сплит тренировки
   * @returns {WorkoutSession | null} Обновлённая сессия или null, если активной сессии нет
   */
  chooseSplit(chatId: number, split: WorkoutSplit): WorkoutSession | null {
    const current = this.sessions.get(chatId);
    if (!current) return null;
    const next: WorkoutSession = { ...current, split, step: 'collecting' };
    this.sessions.save(chatId, next);
    return next;
  }

  /**
   * Отменяет активную тренировку: удаляет сессию из репозитория.
   *
   * @param {number} chatId Идентификатор чата
   * @returns {void}
   */
  cancel(chatId: number): void {
    this.sessions.remove(chatId);
  }

  /**
   * Добавляет пользовательскую строку в текущую сессию.
   *
   * Поведение:
   * - если активной сессии нет или step !== 'collecting' → null
   * - если строка распознана как упражнение → устанавливает currentExercise и гарантирует наличие упражнения в списке
   * - если строка распознана как подход:
   *   - при отсутствии currentExercise создаёт "Без названия" и добавляет в exercises
   *   - добавляет entry в sets текущего упражнения
   *
   * @param {number} chatId Идентификатор чата
   * @param {string} text Строка пользовательского ввода
   * @returns {WorkoutSession | null} Обновлённая сессия или null, если операция невозможна
   */
  addLine(chatId: number, text: string): WorkoutSession | null {
    const current = this.sessions.get(chatId);
    if (!current || current.step !== 'collecting') return null;

    const parsed = this.parser.parse(text);

    if (parsed.kind === 'exercise') {
      const next: WorkoutSession = {
        ...current,
        currentExercise: parsed.name,
        exercises: this.ensureExercise(current.exercises, parsed.name),
      };
      this.sessions.save(chatId, next);
      return next;
    }

    const exerciseName = current.currentExercise ?? 'Без названия';
    const withExercise: WorkoutSession = current.currentExercise
      ? current
      : {
          ...current,
          currentExercise: exerciseName,
          exercises: this.ensureExercise(current.exercises, exerciseName),
        };

    const next = this.appendSet(withExercise, exerciseName, parsed.entry);
    this.sessions.save(chatId, next);
    return next;
  }

  /**
   * Завершает активную тренировку и сохраняет итоговый Workout.
   *
   * Условия успешного завершения:
   * - есть активная сессия
   * - step === 'collecting'
   * - split выбран
   *
   * Побочные эффекты:
   * - сохраняет Workout в workouts
   * - удаляет сессию из sessions
   *
   * @param {number} chatId Идентификатор чата
   * @returns {Workout | null} Итоговая тренировка или null, если завершение невозможно
   */
  finalize(chatId: number): Workout | null {
    const current = this.sessions.get(chatId);
    if (!current || current.step !== 'collecting' || !current.split)
      return null;

    const workout: Workout = {
      date: current.date,
      split: current.split,
      exercises: current.exercises,
    };
    this.workouts.save(chatId, workout);
    this.sessions.remove(chatId);
    return workout;
  }

  /**
   * Гарантирует наличие упражнения в списке.
   *
   * Если упражнение уже существует (по точному совпадению имени) — возвращает исходный список.
   * Иначе — возвращает новый список с добавленным упражнением.
   *
   * @param {ReadonlyArray<Exercise>} list Текущий список упражнений
   * @param {string} name Имя упражнения
   * @returns {ReadonlyArray<Exercise>} Список с гарантированным наличием упражнения
   */
  private ensureExercise(
    list: ReadonlyArray<Exercise>,
    name: string,
  ): ReadonlyArray<Exercise> {
    return list.some((e) => e.name === name)
      ? list
      : [...list, { name, sets: [] }];
  }

  /**
   * Добавляет подход (SetEntry) в указанное упражнение внутри сессии.
   *
   * @param {WorkoutSession} session Текущая сессия
   * @param {string} exerciseName Имя упражнения, в которое добавляется подход
   * @param {SetEntry} entry Добавляемая запись подхода
   * @returns {WorkoutSession} Новая версия сессии с добавленным подходом
   */
  private appendSet(
    session: WorkoutSession,
    exerciseName: string,
    entry: SetEntry,
  ): WorkoutSession {
    return {
      ...session,
      exercises: session.exercises.map((ex) =>
        ex.name !== exerciseName ? ex : { ...ex, sets: [...ex.sets, entry] },
      ),
    };
  }
}
