import { Redis } from "@upstash/redis";

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }

  return new Redis({
    url,
    token,
  });
};

const redis = getRedisClient();

const ONLINE_USERS_KEY_PREFIX = "online_users:";
const ONLINE_USER_TTL = 60; // 60 секунд - пользователь считается онлайн если был активен в последние 60 секунд

/**
 * Отмечает пользователя как онлайн
 * @param projectId ID проекта
 * @param sessionId ID сессии пользователя
 */
export async function markUserOnline(
  projectId: string,
  sessionId: string
): Promise<void> {
  const key = `${ONLINE_USERS_KEY_PREFIX}${projectId}:${sessionId}`;
  await redis.set(key, Date.now(), { ex: ONLINE_USER_TTL });
}

/**
 * Получает количество онлайн пользователей для проекта
 * @param projectId ID проекта
 * @returns Количество уникальных онлайн пользователей
 */
export async function getOnlineUsersCount(projectId: string): Promise<number> {
  const pattern = `${ONLINE_USERS_KEY_PREFIX}${projectId}:*`;

  // Используем SCAN для поиска всех ключей с паттерном
  const keys: string[] = [];
  let cursor: number | string = 0;

  do {
    const result = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });
    // SCAN возвращает [cursor, keys[]]
    if (Array.isArray(result) && result.length === 2) {
      const nextCursor = result[0];
      cursor =
        typeof nextCursor === "string"
          ? parseInt(nextCursor, 10)
          : (nextCursor as number);
      const scannedKeys = result[1] as string[];
      if (Array.isArray(scannedKeys)) {
        keys.push(...scannedKeys);
      }
    } else {
      break;
    }
  } while (cursor !== 0);

  return keys.length;
}

/**
 * Получает список всех онлайн пользователей для проекта
 * @param projectId ID проекта
 * @returns Массив sessionId онлайн пользователей
 */
export async function getOnlineUsers(projectId: string): Promise<string[]> {
  const pattern = `${ONLINE_USERS_KEY_PREFIX}${projectId}:*`;

  const keys: string[] = [];
  let cursor: number | string = 0;

  do {
    const result = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });
    // SCAN возвращает [cursor, keys[]]
    if (Array.isArray(result) && result.length === 2) {
      const nextCursor = result[0];
      cursor =
        typeof nextCursor === "string"
          ? parseInt(nextCursor, 10)
          : (nextCursor as number);
      const scannedKeys = result[1] as string[];
      if (Array.isArray(scannedKeys)) {
        keys.push(...scannedKeys);
      }
    } else {
      break;
    }
  } while (cursor !== 0);

  // Извлекаем sessionId из ключей (формат: online_users:projectId:sessionId)
  return keys.map((key) => key.split(":").slice(2).join(":"));
}
