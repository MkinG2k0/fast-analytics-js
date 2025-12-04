# Инструкция по перегенерации Prisma Client

1. Остановите dev-сервер (Ctrl+C в терминале где запущен `npm run dev` или `pnpm dev`)

2. Выполните команду:
```bash
cd apps/web
npx prisma generate
```

3. Перезапустите dev-сервер:
```bash
pnpm dev
```

После этого ошибка должна исчезнуть.

