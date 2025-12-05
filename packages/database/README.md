# @repo/database

Пакет для работы с базой данных через Prisma. Содержит схему базы данных, миграции и сгенерированный Prisma Client.

## Использование

### Импорт PrismaClient

```typescript
import { PrismaClient } from "@repo/database";

const prisma = new PrismaClient();
```

### Импорт типов

```typescript
import type { User, Project, Event, Prisma } from "@repo/database";
```

### Работа с Prisma

```typescript
import { Prisma, PrismaClient } from "@repo/database";

const prisma = new PrismaClient();

// Использование Prisma.JsonNull
const data = {
  context: event.context || Prisma.JsonNull,
};
```

## Команды

- `pnpm db:generate` - Генерация Prisma Client
- `pnpm db:push` - Применение изменений схемы к БД без миграций
- `pnpm db:migrate` - Создание и применение миграций
- `pnpm db:reset` - Сброс БД и применение всех миграций
- `pnpm db:studio` - Запуск Prisma Studio

## Решение проблем

### Ошибка P1017: Server has closed the connection (Neon PostgreSQL)

Если вы используете **Neon PostgreSQL** и получаете ошибку `P1017: Server has closed the connection` при выполнении миграций, это происходит потому, что Prisma миграции **не работают с pooler URL**.

**Решение:**

1. **Используйте прямой URL (direct connection)** вместо pooler URL в `DATABASE_URL`:
   - ❌ Pooler URL: `postgresql://user:pass@ep-xxx-**pooler**.region.aws.neon.tech/db`
   - ✅ Прямой URL: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db` (без `-pooler`)

2. **Где найти прямой URL в Neon:**
   - Откройте ваш проект в Neon Console
   - Перейдите в раздел "Connection Details"
   - Используйте строку подключения из секции "Direct connection" (не "Pooled connection")

3. **Альтернатива:** Если нужно использовать pooler URL для приложения, создайте отдельный `.env` файл в `packages/database/` с прямым URL только для миграций, или временно замените `DATABASE_URL` на прямой URL перед выполнением миграций.

## Структура

- `prisma/schema.prisma` - Схема базы данных
- `prisma/migrations/` - Миграции базы данных
- `src/client/` - Сгенерированный Prisma Client (не коммитится)
- `src/index.ts` - Экспорты пакета

