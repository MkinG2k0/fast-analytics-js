# fast-analytics-js

SDK для отправки логов и ошибок в Fast Analytics.

[![npm version](https://img.shields.io/npm/v/fast-analytics-js)](https://www.npmjs.com/package/fast-analytics-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## English

### Installation

```bash
npm install fast-analytics-js
```

**Requirements:** Node.js >= 18

### Quick Start

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
});
```

**That's it!** The SDK automatically captures all errors without requiring manual logging.

### Features

- ✅ **Automatic error capture** - No code changes needed
- ✅ **Page visit tracking** - Automatic SPA route tracking
- ✅ **Session management** - Automatic session tracking
- ✅ **Batch processing** - Efficient event batching
- ✅ **TypeScript support** - Full type definitions included
- ✅ **Zero dependencies** - Lightweight and fast
- ✅ **Framework agnostic** - Works with React, Vue, Angular, or vanilla JS

### View Logs in Dashboard

View and analyze all captured logs and errors in the Fast Analytics dashboard:

🔗 **[https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/)**

The dashboard provides:

- Real-time error monitoring
- Detailed error stack traces
- Filtering and search capabilities
- Session tracking
- Custom tags and metadata
- Page visit analytics

### Automatic Error Capture

By default, the SDK automatically captures **all errors** without requiring you to write any logger code:

- ✅ **JavaScript errors** (`window.onerror`) - syntax errors, runtime errors, etc.
- ✅ **Unhandled promise rejections** (`unhandledrejection`) - async errors
- ✅ **Resource loading errors** - failed image, script, or stylesheet loads
- ✅ **HTTP request errors** - failed fetch/XHR requests (4xx, 5xx status codes)
- ✅ **Network errors** - connection failures, timeouts, etc.

**You don't need to manually wrap your code in try-catch blocks or add error handlers** - the SDK handles everything automatically!

**Note:** The SDK automatically excludes its own API requests from error tracking to prevent infinite loops.

### Manual Logging (Optional)

While automatic capture handles most cases, you can also manually log errors, warnings, or info messages:

```typescript
import { logError, logWarning, logInfo, logDebug } from "fast-analytics-js";

// Manual error logging (optional - automatic capture already handles most errors)
try {
  // your code
} catch (error) {
  logError(error, {
    userId: "user123",
    customTags: { section: "checkout", action: "payment" },
    url: window.location.href,
  });
}

// Log warnings
logWarning("User performed unusual action", {
  userId: "user123",
  customTags: { action: "unusual_behavior" },
});

// Log info messages
logInfo("User visited page", { url: "/dashboard" });

// Log debug messages
logDebug("Debug information", { data: someData });
```

### Event Context

You can provide additional context when logging events:

```typescript
import { logError } from "fast-analytics-js";

logError(error, {
  userId: "user123", // User identifier
  userAgent: navigator.userAgent, // Browser user agent
  url: window.location.href, // Current URL
  sessionId: "custom-session-id", // Custom session ID
  customTags: {
    // Custom key-value pairs for filtering
    section: "checkout",
    action: "payment",
    environment: "production",
  },
  // Any additional custom data
  orderId: "order-123",
  amount: 99.99,
});
```

### Page Visit Tracking

By default, the SDK automatically tracks page visits:

- ✅ **Automatic page view tracking** - tracks every page visit automatically
- ✅ **SPA support** - tracks route changes in Single Page Applications (History API)
- ✅ **Time on page** - measures how long users spend on each page
- ✅ **Referrer tracking** - tracks where users came from
- ✅ **Browser navigation** - tracks back/forward button usage

**You don't need to manually track page views** - the SDK handles everything automatically!

#### Manual Page Visit Tracking (Optional)

You can also manually track page visits:

```typescript
import { trackPageVisit } from "fast-analytics-js";

// Track a page visit manually
await trackPageVisit(
  "https://example.com/page", // Full URL
  "/page", // Pathname
  "https://example.com/referrer" // Referrer URL
);
```

#### Disable Automatic Page Tracking

If you want to disable automatic page tracking:

```typescript
init({
  projectKey: "your-project-api-key",
  enablePageTracking: false, // Disable automatic page tracking
});
```

### Initialization Options

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key", // Required: Your project API key
  endpoint: "https://your-domain.com/api/events", // Optional: defaults to "https://fast-analytics.vercel.app/api/events"
  userId: "optional-user-id", // Optional: set user ID globally for all events
  enableAutoCapture: true, // Optional: Enable automatic error capture (default: true)
  enablePageTracking: true, // Optional: Enable automatic page visit tracking (default: true)
  batchSize: 10, // Optional: Batch size for sending events (default: 10)
  batchTimeout: 5000, // Optional: Batch timeout in ms (default: 5000)
});
```

#### Batch Processing

The SDK uses batch processing to efficiently send events:

- Events are collected in batches
- Batches are sent when either:
  - The batch reaches `batchSize` events, or
  - `batchTimeout` milliseconds have passed
- This reduces network requests and improves performance

You can customize batch behavior:

```typescript
init({
  projectKey: "your-project-api-key",
  batchSize: 20, // Send when 20 events are collected
  batchTimeout: 10000, // Or after 10 seconds
});
```

### Disable Automatic Capture

If you want to disable automatic error capture and handle errors manually:

```typescript
init({
  projectKey: "your-project-api-key",
  enableAutoCapture: false, // Disable automatic capture
});
```

### Force Flush Events

Send all accumulated events immediately (useful before page unload or app shutdown):

```typescript
import { flush } from "fast-analytics-js";

// Send all accumulated events immediately
await flush();
```

**Tip:** Call `flush()` before page unload to ensure all events are sent:

```typescript
window.addEventListener("beforeunload", () => {
  flush();
});
```

### Session Management

The SDK automatically manages sessions. Each session has a unique ID that persists across page reloads:

```typescript
import { getSessionId, resetSession } from "fast-analytics-js";

// Get current session ID
const sessionId = getSessionId();
console.log("Current session:", sessionId);

// Reset session (create new one)
resetSession();
```

**Note:** Session IDs are stored in `sessionStorage` and persist across page reloads within the same browser tab.

### Teardown SDK

Clean up and disable the SDK (useful for testing or when removing the SDK):

```typescript
import { teardown } from "fast-analytics-js";

// Disable automatic error capture and cleanup all handlers
teardown();
```

After calling `teardown()`, you can re-initialize the SDK by calling `init()` again.

### TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type {
  EventContext,
  EventLevel,
  EventPayload,
  EventPerformance,
  InitOptions,
  PageVisitPayload,
} from "fast-analytics-js";

// Use types in your code
const context: EventContext = {
  userId: "user123",
  customTags: { section: "checkout" },
};
```

### Usage Examples

#### React Application

```typescript
import { useEffect } from "react";
import { init, flush } from "fast-analytics-js";

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
    });

    // Flush events before page unload
    const handleBeforeUnload = () => {
      flush();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return <div>...</div>;
}
```

#### Next.js Application

```typescript
// app/layout.tsx or pages/_app.tsx
import { useEffect } from "react";
import { init } from "fast-analytics-js";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
    });
  }, []);

  return <html>{children}</html>;
}
```

#### Vue Application

```typescript
import { createApp } from "vue";
import { init, flush } from "fast-analytics-js";

init({
  projectKey: import.meta.env.VITE_FAST_ANALYTICS_KEY,
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
  // endpoint: import.meta.env.VITE_FAST_ANALYTICS_ENDPOINT
});

// Flush events before page unload
window.addEventListener("beforeunload", () => {
  flush();
});

const app = createApp(App);
// All errors are automatically captured - no additional code needed!
app.mount("#app");
```

#### Vanilla JavaScript

```html
<script type="module">
  import { init, flush } from "fast-analytics-js";

  init({
    projectKey: "your-project-api-key",
    // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
  });

  // Flush events before page unload
  window.addEventListener("beforeunload", () => {
    flush();
  });

  // All errors are automatically captured!
</script>
```

---

## Русский

### Установка

```bash
npm install fast-analytics-js
```

**Требования:** Node.js >= 18

### Быстрый старт

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
});
```

**Всё!** SDK автоматически перехватывает все ошибки без необходимости писать код логирования вручную.

### Возможности

- ✅ **Автоматический перехват ошибок** - Не требует изменений в коде
- ✅ **Отслеживание посещений страниц** - Автоматическое отслеживание маршрутов в SPA
- ✅ **Управление сессиями** - Автоматическое отслеживание сессий
- ✅ **Батчинг событий** - Эффективная пакетная обработка событий
- ✅ **Поддержка TypeScript** - Полные определения типов включены
- ✅ **Нулевые зависимости** - Легковесный и быстрый
- ✅ **Независим от фреймворка** - Работает с React, Vue, Angular или vanilla JS

### Просмотр логов в панели управления

Просматривайте и анализируйте все перехваченные логи и ошибки в панели управления Fast Analytics:

🔗 **[https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/)**

Панель управления предоставляет:

- Мониторинг ошибок в реальном времени
- Детальные трассировки стека ошибок
- Возможности фильтрации и поиска
- Отслеживание сессий
- Пользовательские теги и метаданные
- Аналитика посещений страниц

### Автоматический перехват ошибок

По умолчанию SDK автоматически перехватывает **все ошибки** без необходимости писать код логирования:

- ✅ **Ошибки JavaScript** (`window.onerror`) - синтаксические ошибки, ошибки выполнения и т.д.
- ✅ **Необработанные промисы** (`unhandledrejection`) - асинхронные ошибки
- ✅ **Ошибки загрузки ресурсов** - неудачная загрузка изображений, скриптов или стилей
- ✅ **Ошибки HTTP-запросов** - неудачные fetch/XHR запросы (статусы 4xx, 5xx)
- ✅ **Сетевые ошибки** - сбои соединения, таймауты и т.д.

**Вам не нужно вручную оборачивать код в try-catch блоки или добавлять обработчики ошибок** - SDK делает всё автоматически!

**Примечание:** SDK автоматически исключает свои собственные API-запросы из отслеживания ошибок, чтобы предотвратить бесконечные циклы.

### Ручное логирование (опционально)

Хотя автоматический перехват обрабатывает большинство случаев, вы также можете вручную логировать ошибки, предупреждения или информационные сообщения:

```typescript
import { logError, logWarning, logInfo, logDebug } from "fast-analytics-js";

// Ручное логирование ошибок (опционально - автоматический перехват уже обрабатывает большинство ошибок)
try {
  // ваш код
} catch (error) {
  logError(error, {
    userId: "user123",
    customTags: { section: "checkout", action: "payment" },
    url: window.location.href,
  });
}

// Логирование предупреждений
logWarning("Пользователь выполнил необычное действие", {
  userId: "user123",
  customTags: { action: "unusual_behavior" },
});

// Логирование информационных сообщений
logInfo("Пользователь зашел на страницу", { url: "/dashboard" });

// Логирование отладочных сообщений
logDebug("Отладочная информация", { data: someData });
```

### Контекст событий

Вы можете предоставить дополнительный контекст при логировании событий:

```typescript
import { logError } from "fast-analytics-js";

logError(error, {
  userId: "user123", // Идентификатор пользователя
  userAgent: navigator.userAgent, // User agent браузера
  url: window.location.href, // Текущий URL
  sessionId: "custom-session-id", // Пользовательский ID сессии
  customTags: {
    // Пользовательские пары ключ-значение для фильтрации
    section: "checkout",
    action: "payment",
    environment: "production",
  },
  // Любые дополнительные пользовательские данные
  orderId: "order-123",
  amount: 99.99,
});
```

### Отслеживание посещений страниц

По умолчанию SDK автоматически отслеживает посещения страниц:

- ✅ **Автоматическое отслеживание просмотров страниц** - отслеживает каждое посещение страницы автоматически
- ✅ **Поддержка SPA** - отслеживает изменения маршрутов в одностраничных приложениях (History API)
- ✅ **Время на странице** - измеряет, сколько времени пользователи проводят на каждой странице
- ✅ **Отслеживание реферера** - отслеживает, откуда пришли пользователи
- ✅ **Навигация браузера** - отслеживает использование кнопок назад/вперед

**Вам не нужно вручную отслеживать просмотры страниц** - SDK делает всё автоматически!

#### Ручное отслеживание посещений (опционально)

Вы также можете вручную отслеживать посещения страниц:

```typescript
import { trackPageVisit } from "fast-analytics-js";

// Отследить посещение страницы вручную
await trackPageVisit(
  "https://example.com/page", // Полный URL
  "/page", // Путь
  "https://example.com/referrer" // URL реферера
);
```

#### Отключение автоматического отслеживания страниц

Если вы хотите отключить автоматическое отслеживание страниц:

```typescript
init({
  projectKey: "your-project-api-key",
  enablePageTracking: false, // Отключить автоматическое отслеживание страниц
});
```

### Опции инициализации

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key", // Обязательно: API-ключ вашего проекта
  endpoint: "https://your-domain.com/api/events", // Опционально: по умолчанию "https://fast-analytics.vercel.app/api/events"
  userId: "optional-user-id", // Опционально: установить ID пользователя глобально для всех событий
  enableAutoCapture: true, // Опционально: Включить автоматический перехват (по умолчанию: true)
  enablePageTracking: true, // Опционально: Включить автоматическое отслеживание посещений страниц (по умолчанию: true)
  batchSize: 10, // Опционально: Размер батча для отправки событий (по умолчанию: 10)
  batchTimeout: 5000, // Опционально: Таймаут отправки батча в мс (по умолчанию: 5000)
});
```

#### Пакетная обработка

SDK использует пакетную обработку для эффективной отправки событий:

- События собираются в батчи
- Батчи отправляются когда:
  - Батч достигает `batchSize` событий, или
  - Прошло `batchTimeout` миллисекунд
- Это уменьшает количество сетевых запросов и улучшает производительность

Вы можете настроить поведение батчей:

```typescript
init({
  projectKey: "your-project-api-key",
  batchSize: 20, // Отправить когда собрано 20 событий
  batchTimeout: 10000, // Или через 10 секунд
});
```

### Отключение автоматического перехвата

Если вы хотите отключить автоматический перехват ошибок и обрабатывать их вручную:

```typescript
init({
  projectKey: "your-project-api-key",
  enableAutoCapture: false, // Отключить автоматический перехват
});
```

### Принудительная отправка событий

Отправить все накопленные события немедленно (полезно перед закрытием страницы или остановкой приложения):

```typescript
import { flush } from "fast-analytics-js";

// Отправить все накопленные события немедленно
await flush();
```

**Совет:** Вызовите `flush()` перед закрытием страницы, чтобы убедиться, что все события отправлены:

```typescript
window.addEventListener("beforeunload", () => {
  flush();
});
```

### Управление сессией

SDK автоматически управляет сессиями. Каждая сессия имеет уникальный ID, который сохраняется при перезагрузке страницы:

```typescript
import { getSessionId, resetSession } from "fast-analytics-js";

// Получить ID текущей сессии
const sessionId = getSessionId();
console.log("Текущая сессия:", sessionId);

// Сбросить сессию (создать новую)
resetSession();
```

**Примечание:** ID сессий хранятся в `sessionStorage` и сохраняются при перезагрузке страницы в той же вкладке браузера.

### Отключение SDK

Очистить и отключить SDK (полезно для тестирования или при удалении SDK):

```typescript
import { teardown } from "fast-analytics-js";

// Отключить автоматический перехват ошибок и очистить все обработчики
teardown();
```

После вызова `teardown()` вы можете повторно инициализировать SDK, вызвав `init()` снова.

### Поддержка TypeScript

SDK написан на TypeScript и включает полные определения типов:

```typescript
import type {
  EventContext,
  EventLevel,
  EventPayload,
  EventPerformance,
  InitOptions,
  PageVisitPayload,
} from "fast-analytics-js";

// Используйте типы в вашем коде
const context: EventContext = {
  userId: "user123",
  customTags: { section: "checkout" },
};
```

### Примеры использования

#### React приложение

```typescript
import { useEffect } from "react";
import { init, flush } from "fast-analytics-js";

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
    });

    // Отправить события перед закрытием страницы
    const handleBeforeUnload = () => {
      flush();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return <div>...</div>;
}
```

#### Next.js приложение

```typescript
// app/layout.tsx или pages/_app.tsx
import { useEffect } from "react";
import { init } from "fast-analytics-js";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
    });
  }, []);

  return <html>{children}</html>;
}
```

#### Vue приложение

```typescript
import { createApp } from "vue";
import { init, flush } from "fast-analytics-js";

init({
  projectKey: import.meta.env.VITE_FAST_ANALYTICS_KEY,
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
  // endpoint: import.meta.env.VITE_FAST_ANALYTICS_ENDPOINT
});

// Отправить события перед закрытием страницы
window.addEventListener("beforeunload", () => {
  flush();
});

const app = createApp(App);
// Все ошибки автоматически перехватываются - дополнительный код не требуется!
app.mount("#app");
```

#### Vanilla JavaScript

```html
<script type="module">
  import { init, flush } from "fast-analytics-js";

  init({
    projectKey: "your-project-api-key",
    // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
  });

  // Отправить события перед закрытием страницы
  window.addEventListener("beforeunload", () => {
    flush();
  });

  // Все ошибки автоматически перехватываются!
</script>
```

---

## License

MIT
