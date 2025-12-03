# @fast-analytics/sdk

SDK для отправки логов и ошибок в Fast Analytics.

## Установка

```bash
npm install @fast-analytics/sdk
```

## Использование

### Базовая инициализация

```typescript
import { init, logError, logWarning } from '@fast-analytics/sdk';

init({
  projectKey: 'your-project-api-key',
  endpoint: 'https://your-domain.com/api/events'
});
```

### Автоматический перехват ошибок

SDK автоматически перехватывает:
- `window.onerror` - ошибки JavaScript
- `window.onunhandledrejection` - необработанные промисы

### Ручная отправка ошибок

```typescript
try {
  // ваш код
} catch (error) {
  logError(error, {
    customTags: { section: 'checkout' }
  });
}
```

### Отправка предупреждений

```typescript
logWarning('Пользователь выполнил необычное действие', {
  userId: 'user123',
  customTags: { action: 'unusual_behavior' }
});
```

### Другие уровни логирования

```typescript
logInfo('Пользователь зашел на страницу', { url: '/dashboard' });
logDebug('Отладочная информация', { data: someData });
```

### Опции инициализации

```typescript
init({
  projectKey: 'your-project-api-key',
  endpoint: 'https://your-domain.com/api/events',
  enableAutoCapture: true, // включить автоматический перехват (по умолчанию true)
  batchSize: 10, // размер батча для отправки (по умолчанию 10)
  batchTimeout: 5000 // таймаут отправки батча в мс (по умолчанию 5000)
});
```

### Принудительная отправка событий

```typescript
import { flush } from '@fast-analytics/sdk';

// Отправить все накопленные события немедленно
await flush();
```

### Управление сессией

```typescript
import { getSessionId, resetSession } from '@fast-analytics/sdk';

// Получить ID текущей сессии
const sessionId = getSessionId();

// Сбросить сессию (создать новую)
resetSession();
```

### Отключение SDK

```typescript
import { teardown } from '@fast-analytics/sdk';

// Отключить автоматический перехват ошибок
teardown();
```

## Примеры использования

### React приложение

```typescript
import { useEffect } from 'react';
import { init, logError } from '@fast-analytics/sdk';

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT!
    });
  }, []);

  const handleError = (error: Error) => {
    logError(error, {
      customTags: { component: 'App' }
    });
  };

  return <div>...</div>;
}
```

### Vue приложение

```typescript
import { createApp } from 'vue';
import { init, logError } from '@fast-analytics/sdk';

init({
  projectKey: import.meta.env.VITE_FAST_ANALYTICS_KEY,
  endpoint: import.meta.env.VITE_FAST_ANALYTICS_ENDPOINT
});

const app = createApp(App);

app.config.errorHandler = (err) => {
  logError(err as Error);
};

app.mount('#app');
```

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Разработка с watch режимом
npm run dev

# Проверка типов
npm run check-types

# Линтинг
npm run lint
```

## Публикация в npm

```bash
# Убедитесь, что версия обновлена в package.json
npm version patch|minor|major

# Публикация
npm publish --access public
```

