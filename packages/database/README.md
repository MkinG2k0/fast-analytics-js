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

## Структура

- `prisma/schema.prisma` - Схема базы данных
- `prisma/migrations/` - Миграции базы данных
- `src/client/` - Сгенерированный Prisma Client (не коммитится)
- `src/index.ts` - Экспорты пакета

