import { axiosInstance } from './axios.instance';

/**
 * Обрабатывает успешный HTTP-ответ API стандартного формата.
 *
 * Ожидаемый контракт ответа:
 * {
 *   success: boolean;
 *   data: T;
 * }
 *
 * Поведение:
 * - при success=false выбрасывает исключение
 * - при success=true возвращает поле data
 *
 * @template T Тип полезной нагрузки ответа
 * @param {{ data: { success: boolean; data: T } }} res HTTP-ответ Axios
 * @param res.data
 * @param res.data.success
 * @param res.data.data
 * @returns {T} Полезная нагрузка ответа
 * @throws {Error} если success=false
 */
function handleResponse<T>(res: { data: { success: boolean; data: T } }): T {
  if (!res.data.success) {
    throw new Error('Неуспешный ответ от API');
  }

  return res.data.data;
}

/**
 * Унифицированный обработчик ошибок API-запросов.
 *
 * Поведение:
 * - логирует исходную ошибку
 * - пробрасывает ошибку выше без изменения
 *
 * @param {unknown} err Ошибка, полученная при выполнении запроса
 * @returns {never}
 * @throws {unknown} Всегда выбрасывает переданную ошибку
 */
function handleApiError(err: unknown): never {
  console.error('API Error:', err);
  throw err;
}

/**
 * API-клиент команд.
 *
 * Ответственность:
 * - инкапсуляция HTTP-вызовов, связанных с командами
 * - возврат доменных данных без HTTP-обёрток
 */
export const commandsApi = {
  /**
   * Загружает список команд с сервера.
   *
   * @returns {Promise<unknown>} Результат API-вызова
   */
  getCommands: async () =>
    axiosInstance.get('/commands/').then(handleResponse).catch(handleApiError),
};
