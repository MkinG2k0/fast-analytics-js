# fast-analytics-js

SDK for sending logs and errors to Fast Analytics.

---

## English

### Installation

```bash
npm install fast-analytics-js
```

### Quick Start

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
});
```

**That's it!** The SDK automatically captures all errors without requiring manual logging.

### View Logs in Dashboard

View and analyze all captured logs and errors in the Fast Analytics dashboard:

🔗 **[https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/)**

The dashboard provides:

- Real-time error monitoring
- Detailed error stack traces
- Filtering and search capabilities
- Session tracking
- Custom tags and metadata

### Automatic Error Capture

By default, the SDK automatically captures **all errors** without requiring you to write any logger code:

- ✅ **JavaScript errors** (`window.onerror`) - syntax errors, runtime errors, etc.
- ✅ **Unhandled promise rejections** (`unhandledrejection`) - async errors
- ✅ **Resource loading errors** - failed image, script, or stylesheet loads
- ✅ **HTTP request errors** - failed fetch/XHR requests (4xx, 5xx status codes)
- ✅ **Network errors** - connection failures, timeouts, etc.

**You don't need to manually wrap your code in try-catch blocks or add error handlers** - the SDK handles everything
automatically!

### Manual Logging (Optional)

While automatic capture handles most cases, you can also manually log errors, warnings, or info messages:

```typescript
import { logError, logWarning, logInfo, logDebug } from "fast-analytics-js";

// Manual error logging (optional - automatic capture already handles most errors)
try {
  // your code
} catch (error) {
  logError(error, {
    customTags: { section: "checkout" },
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

### Initialization Options

```typescript
init({
  projectKey: "your-project-api-key",
  endpoint: "https://your-domain.com/api/events", // Optional: defaults to "https://fast-analytics.vercel.app/api/events"
  userId: "optional-user-id", // Optional: set user ID globally
  enableAutoCapture: true, // Enable automatic error capture (default: true)
  batchSize: 10, // Batch size for sending events (default: 10)
  batchTimeout: 5000, // Batch timeout in ms (default: 5000)
});
```

### Disable Automatic Capture

If you want to disable automatic error capture and handle errors manually:

```typescript
init({
  projectKey: "your-project-api-key",
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
  enableAutoCapture: false, // Disable automatic capture
});
```

### Force Flush Events

```typescript
import { flush } from "fast-analytics-js";

// Send all accumulated events immediately
await flush();
```

### Session Management

```typescript
import { getSessionId, resetSession } from "fast-analytics-js";

// Get current session ID
const sessionId = getSessionId();

// Reset session (create new one)
resetSession();
```

### Teardown SDK

```typescript
import { teardown } from "fast-analytics-js";

// Disable automatic error capture and cleanup
teardown();
```

### Usage Examples

#### React Application

```typescript
import { useEffect } from 'react';
import { init } from 'fast-analytics-js';

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
    });
    // All errors are automatically captured - no additional code needed!
  }, []);

  return <div>...</div>;
}
```

#### Vue Application

```typescript
import { createApp } from "vue";
import { init } from "fast-analytics-js";

init({
  projectKey: import.meta.env.VITE_FAST_ANALYTICS_KEY,
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
  // endpoint: import.meta.env.VITE_FAST_ANALYTICS_ENDPOINT
});

const app = createApp(App);
// All errors are automatically captured - no additional code needed!
app.mount("#app");
```

#### Vanilla JavaScript

```html
<script type="module">
  import { init } from "fast-analytics-js";

  init({
    projectKey: "your-project-api-key",
    // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
  });

  // All errors are automatically captured!
</script>
```

---

## Русский

SDK для отправки логов и ошибок в Fast Analytics.

### Установка

```bash
npm install fast-analytics-js
```

### Быстрый старт

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
});
```

**Всё!** SDK автоматически перехватывает все ошибки без необходимости писать код логирования вручную.

### Просмотр логов в панели управления

Просматривайте и анализируйте все перехваченные логи и ошибки в панели управления Fast Analytics:

🔗 **[https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/)**

Панель управления предоставляет:

- Мониторинг ошибок в реальном времени
- Детальные трассировки стека ошибок
- Возможности фильтрации и поиска
- Отслеживание сессий
- Пользовательские теги и метаданные

### Автоматический перехват ошибок

По умолчанию SDK автоматически перехватывает **все ошибки** без необходимости писать код логирования:

- ✅ **Ошибки JavaScript** (`window.onerror`) - синтаксические ошибки, ошибки выполнения и т.д.
- ✅ **Необработанные промисы** (`unhandledrejection`) - асинхронные ошибки
- ✅ **Ошибки загрузки ресурсов** - неудачная загрузка изображений, скриптов или стилей
- ✅ **Ошибки HTTP-запросов** - неудачные fetch/XHR запросы (статусы 4xx, 5xx)
- ✅ **Сетевые ошибки** - сбои соединения, таймауты и т.д.

**Вам не нужно вручную оборачивать код в try-catch блоки или добавлять обработчики ошибок** - SDK делает всё
автоматически!

### Ручное логирование (опционально)

Хотя автоматический перехват обрабатывает большинство случаев, вы также можете вручную логировать ошибки, предупреждения
или информационные сообщения:

```typescript
import { logError, logWarning, logInfo, logDebug } from "fast-analytics-js";

// Ручное логирование ошибок (опционально - автоматический перехват уже обрабатывает большинство ошибок)
try {
  // ваш код
} catch (error) {
  logError(error, {
    customTags: { section: "checkout" },
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

### Опции инициализации

```typescript
init({
  projectKey: "your-project-api-key",
  endpoint: "https://your-domain.com/api/events", // Опционально: по умолчанию "https://fast-analytics.vercel.app/api/events"
  userId: "optional-user-id", // Опционально: установить ID пользователя глобально
  enableAutoCapture: true, // Включить автоматический перехват (по умолчанию: true)
  batchSize: 10, // Размер батча для отправки (по умолчанию: 10)
  batchTimeout: 5000, // Таймаут отправки батча в мс (по умолчанию: 5000)
});
```

### Отключение автоматического перехвата

Если вы хотите отключить автоматический перехват ошибок и обрабатывать их вручную:

```typescript
init({
  projectKey: "your-project-api-key",
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
  enableAutoCapture: false, // Отключить автоматический перехват
});
```

### Принудительная отправка событий

```typescript
import { flush } from "fast-analytics-js";

// Отправить все накопленные события немедленно
await flush();
```

### Управление сессией

```typescript
import { getSessionId, resetSession } from "fast-analytics-js";

// Получить ID текущей сессии
const sessionId = getSessionId();

// Сбросить сессию (создать новую)
resetSession();
```

### Отключение SDK

```typescript
import { teardown } from "fast-analytics-js";

// Отключить автоматический перехват ошибок и очистить ресурсы
teardown();
```

### Примеры использования

#### React приложение

```typescript
import { useEffect } from 'react';
import { init } from 'fast-analytics-js';

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
    });
    // Все ошибки автоматически перехватываются - дополнительный код не требуется!
  }, []);

  return <div>...</div>;
}
```

#### Vue приложение

```typescript
import { createApp } from "vue";
import { init } from "fast-analytics-js";

init({
  projectKey: import.meta.env.VITE_FAST_ANALYTICS_KEY,
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
  // endpoint: import.meta.env.VITE_FAST_ANALYTICS_ENDPOINT
});

const app = createApp(App);
// Все ошибки автоматически перехватываются - дополнительный код не требуется!
app.mount("#app");
```

#### Vanilla JavaScript

```html
<script type="module">
  import { init } from "fast-analytics-js";

  init({
    projectKey: "your-project-api-key",
    // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
  });

  // Все ошибки автоматически перехватываются!
</script>
```

---

## License

MIT
