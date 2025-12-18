# fast-analytics-js

SDK for sending logs and errors to Fast Analytics.

[![npm version](https://img.shields.io/npm/v/fast-analytics-js)](https://www.npmjs.com/package/fast-analytics-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Languages:** [English](#english) | [Русский](#русский)

---

## English

### Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Features](#features)
- [View Logs in Dashboard](#view-logs-in-dashboard)
- [Automatic Error Capture](#automatic-error-capture)
- [Manual Logging](#manual-logging-optional)
- [Page Visit Tracking](#page-visit-tracking)
- [Online User Tracking](#online-user-tracking)
- [Configuration](#initialization-options)
- [API Reference](#api-reference)
- [Examples](#usage-examples)
- [Browser Compatibility](#browser-compatibility)
- [FAQ](#faq)

### Installation

```bash
npm install fast-analytics-js
```

**Requirements:** Node.js >= 18

#### Optional: Screenshot Support

For full screenshot functionality when errors occur, install `html2canvas-pro`:

```bash
npm install html2canvas-pro
```

**Note:** Screenshots will work without `html2canvas-pro`, but with limited functionality. For full page screenshots with support for modern CSS colors (oklch, lab, lch, etc.), `html2canvas-pro` is recommended.

### Quick Start

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
});
```

**That's it!** The SDK automatically captures all errors without requiring manual logging.

**Getting your API key:** Sign up at [https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/) to get your project API key.

### Features

- ✅ **Automatic error capture** - No code changes needed
- ✅ **Error screenshots** - Automatic screenshots when errors occur (optional)
- ✅ **Page visit tracking** - Automatic SPA route tracking
- ✅ **Online user tracking** - Real-time online user count tracking
- ✅ **Session management** - Automatic session tracking
- ✅ **Batch processing** - Efficient event batching
- ✅ **Duplicate prevention** - Automatic duplicate detection and occurrence counting
- ✅ **TypeScript support** - Full type definitions included
- ✅ **Zero dependencies** - Lightweight and fast (html2canvas-pro is optional)
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
- Real-time online user count
- Duplicate error detection and occurrence counting

### Automatic Error Capture

By default, the SDK automatically captures **all errors** without requiring you to write any logger code:

- ✅ **JavaScript errors** (`window.onerror`) - syntax errors, runtime errors, etc.
- ✅ **Unhandled promise rejections** (`unhandledrejection`) - async errors
- ✅ **Resource loading errors** - failed image, script, or stylesheet loads
- ✅ **HTTP request errors** - failed fetch/XHR requests (4xx, 5xx status codes)
- ✅ **Network errors** - connection failures, timeouts, etc.

**You don't need to manually wrap your code in try-catch blocks or add error handlers** - the SDK handles everything automatically!

**Note:** The SDK automatically excludes its own API requests from error tracking to prevent infinite loops.

### Duplicate Error Prevention

The Fast Analytics backend automatically prevents duplicate logs:

- **Automatic detection** - When an event is created, the system checks if an event with the same `url` and `context` already exists in the project
- **Occurrence counting** - If a duplicate is found, instead of creating a new event, the system increments the `occurrenceCount` of the existing event
- **Visibility** - The occurrence count is displayed in the logs table and event details, making it easy to see which errors happen most frequently

This helps:

- Prevent database bloat from repeated errors
- Quickly identify the most common issues
- Reduce storage requirements

**You don't need to do anything** - duplicate prevention works automatically!

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

#### Group Page Visits

You can group page visits by URL patterns to consolidate analytics data. This is useful for pages with dynamic IDs or parameters that you want to track as a single page.

**Example 1: Group all pages under a path**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: ["/example/*"], // All visits to /example/* will be grouped as "/example"
});
```

All visits to `/example/page1`, `/example/page2`, `/example/123` will be tracked as `/example`.

**Example 2: Group pages with dynamic IDs**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: ["/example/*/some"], // Visits like /example/123/some, /example/456/some will be grouped as "/example/*/some"
});
```

All visits to `/example/123/some`, `/example/456/some`, `/example/789/some` will be tracked as `/example/*/some`.

**Example 3: Multiple patterns**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: [
    "/example/*",
    "/products/*/details",
    "/users/*/profile",
  ],
});
```

**Pattern matching rules:**

- `"/example/*"` - Groups all URLs starting with `/example/` into `/example`
- `"/example/*/some"` - Groups URLs like `/example/123/some` into `/example/*/some`
- Patterns are matched in order, and the first match is used
- Use `*` as a wildcard to match any path segment

### Online User Tracking

By default, the SDK automatically tracks online users in real-time:

- ✅ **Automatic heartbeat** - Sends periodic heartbeat signals to track active users
- ✅ **Real-time count** - View current online user count in the dashboard
- ✅ **Session-based tracking** - Each session is tracked independently
- ✅ **Automatic cleanup** - Inactive users are automatically removed after 60 seconds

**You don't need to manually track online users** - the SDK handles everything automatically!

The SDK sends heartbeat signals every 30 seconds (configurable via `heartbeatInterval`) to indicate that a user is active. Users are considered online if they've sent a heartbeat within the last 60 seconds.

#### Disable Online Tracking

If you want to disable online user tracking:

```typescript
init({
  projectKey: "your-project-api-key",
  enableOnlineTracking: false, // Disable online user tracking
});
```

#### Customize Heartbeat Interval

You can customize how often heartbeat signals are sent:

```typescript
init({
  projectKey: "your-project-api-key",
  heartbeatInterval: 15000, // Send heartbeat every 15 seconds
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
  enableOnlineTracking: true, // Optional: Enable online user tracking (default: true)
  enableScreenshotOnError: true, // Optional: Enable automatic screenshots on errors (default: false)
  batchSize: 10, // Optional: Batch size for sending events (default: 10)
  batchTimeout: 5000, // Optional: Batch timeout in ms (default: 5000)
  heartbeatInterval: 30000, // Optional: Heartbeat interval for online tracking in ms (default: 30000)
  ignoreError: {
    // Optional: Ignore specific errors
    codes: [404, 500], // Ignore errors with these status codes
    urls: ["/example/*"], // Ignore errors from these URL patterns
  },
  groupPageVisitsGroup: ["/example/*"], // Optional: Group page visits by URL patterns
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

### Ignore Errors

You can configure the SDK to ignore specific errors based on error codes or URL patterns. This is useful for filtering out known errors that you don't want to track.

#### Ignore by Error Code

Ignore errors with specific HTTP status codes:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    codes: [404, 500, "403"], // Ignore errors with status codes 404, 500, and 403
  },
});
```

#### Ignore by URL Pattern

Ignore errors from specific URLs using wildcard patterns:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    urls: [
      "/example/*", // Ignore all errors on /example/* paths
      "/api/health", // Exact match
      "*.jpg", // All images
      "/admin/*/test", // Pattern with * in the middle
    ],
  },
});
```

#### Combined Ignore Rules

You can combine both error codes and URL patterns. An error will be ignored if it matches either condition:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    codes: [404, 500],
    urls: ["/example/*", "/api/health"],
  },
});
```

**Pattern Matching:**

- `"/example/*"` - Matches all URLs starting with `/example/` (e.g., `/example/page`, `/example/123`)
- `"*.jpg"` - Matches all URLs ending with `.jpg`
- `"/admin/*/test"` - Matches URLs like `/admin/users/test`, `/admin/posts/test`
- Exact match: `"/api/health"` - Matches only `/api/health`

### Error Screenshots

The SDK can automatically capture screenshots when errors occur. This helps you see exactly what the user saw when the error happened.

#### Enable Screenshots

```typescript
init({
  projectKey: "your-project-api-key",
  enableScreenshotOnError: true, // Enable automatic screenshots on errors
});
```

#### Install html2canvas-pro (Recommended)

For full screenshot functionality, install `html2canvas-pro`:

```bash
npm install html2canvas-pro
```

**Without `html2canvas-pro`:** The SDK will use a fallback method that creates a basic screenshot with limited functionality.

**With `html2canvas-pro`:** The SDK will capture full page screenshots with all styles and content rendered correctly, including support for modern CSS colors (oklch, lab, lch, etc.).

Screenshots are automatically attached to error events and can be viewed in the Fast Analytics dashboard.

### Force Flush Events

Send all accumulated events immediately (useful before page unload or app shutdown):

```typescript
import { flush } from "fast-analytics-js";

// Send all accumulated events immediately
await flush();
```

**Note:** The SDK automatically flushes events when the page is about to unload (`beforeunload`) or when the tab becomes hidden (`visibilitychange`). You don't need to manually set up these handlers.

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

### API Reference

#### Functions

##### `init(options: InitOptions): void`

Initializes the SDK with the provided configuration options. Must be called before using any other SDK functions.

```typescript
init({
  projectKey: "your-project-api-key",
  // ... other options
});
```

##### `logError(error: Error | string, context?: EventContext): Promise<void>`

Manually log an error. Accepts either an Error object or a string message.

```typescript
await logError(new Error("Something went wrong"), {
  userId: "user123",
  customTags: { section: "checkout" },
});
```

##### `logWarning(message: string, context?: EventContext): Promise<void>`

Log a warning message.

```typescript
await logWarning("Unusual user behavior detected", {
  userId: "user123",
});
```

##### `logInfo(message: string, context?: EventContext): Promise<void>`

Log an informational message.

```typescript
await logInfo("User completed checkout", {
  userId: "user123",
  orderId: "order-123",
});
```

##### `logDebug(message: string, context?: EventContext): Promise<void>`

Log a debug message.

```typescript
await logDebug("Debug information", {
  data: someData,
});
```

##### `trackPageVisit(url?: string, pathname?: string, referrer?: string): Promise<void>`

Manually track a page visit. If called without arguments, uses current page information.

```typescript
await trackPageVisit(
  "https://example.com/page",
  "/page",
  "https://example.com/referrer"
);
```

##### `flush(): Promise<void>`

Immediately send all accumulated events in the batch queue.

```typescript
await flush();
```

##### `getSessionId(): string`

Get the current session ID.

```typescript
const sessionId = getSessionId();
```

##### `resetSession(): void`

Create a new session (generates a new session ID).

```typescript
resetSession();
```

##### `teardown(): void`

Clean up and disable the SDK. Removes all event listeners and stops tracking.

```typescript
teardown();
```

#### Types

##### `InitOptions`

Configuration options for SDK initialization.

```typescript
interface InitOptions {
  projectKey: string; // Required: Your project API key
  endpoint?: string; // Optional: API endpoint URL
  userId?: string; // Optional: Global user ID for all events
  enableAutoCapture?: boolean; // Optional: Enable automatic error capture (default: true)
  enablePageTracking?: boolean; // Optional: Enable page visit tracking (default: true)
  enableOnlineTracking?: boolean; // Optional: Enable online user tracking (default: true)
  enableScreenshotOnError?: boolean; // Optional: Enable screenshots on errors (default: false)
  batchSize?: number; // Optional: Batch size for events (default: 10)
  batchTimeout?: number; // Optional: Batch timeout in ms (default: 5000)
  heartbeatInterval?: number; // Optional: Heartbeat interval in ms (default: 30000)
  ignoreError?: {
    codes?: (string | number)[]; // HTTP status codes to ignore
    urls?: string[]; // URL patterns to ignore
  };
  groupPageVisitsGroup?: string[]; // URL patterns for grouping page visits
}
```

##### `EventContext`

Additional context data for events.

```typescript
interface EventContext {
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  customTags?: Record<string, string>;
  [key: string]: unknown; // Any additional custom data
}
```

##### `EventLevel`

Log level for events.

```typescript
type EventLevel = "error" | "warn" | "info" | "debug";
```

##### `EventPayload`

Complete event payload structure.

```typescript
interface EventPayload {
  level: EventLevel;
  message: string;
  stack?: string;
  context?: EventContext;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  performance?: EventPerformance;
  screenshotUrl?: string;
}
```

##### `PageVisitPayload`

Page visit event payload.

```typescript
interface PageVisitPayload {
  url: string;
  pathname?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  duration?: number; // Time spent on page in milliseconds
}
```

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
import { init } from "fast-analytics-js";

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint is optional - defaults to "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
      enableScreenshotOnError: true, // Optional: Enable error screenshots
      batchSize: 10, // Optional: Customize batch size
    });
    // Events are automatically flushed on page unload - no manual setup needed!
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
  // Events are automatically flushed on page unload - no manual setup needed!
</script>
```

---

## Русский

### Содержание

- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Возможности](#возможности)
- [Просмотр логов в панели управления](#просмотр-логов-в-панели-управления)
- [Автоматический перехват ошибок](#автоматический-перехват-ошибок)
- [Ручное логирование](#ручное-логирование-опционально)
- [Отслеживание посещений страниц](#отслеживание-посещений-страниц)
- [Отслеживание онлайн пользователей](#отслеживание-онлайн-пользователей)
- [Конфигурация](#опции-инициализации)
- [Справочник API](#справочник-api)
- [Примеры использования](#примеры-использования)
- [Совместимость с браузерами](#совместимость-с-браузерами)
- [Часто задаваемые вопросы](#часто-задаваемые-вопросы)

### Установка

```bash
npm install fast-analytics-js
```

**Требования:** Node.js >= 18

#### Опционально: Поддержка скриншотов

Для полноценной функциональности скриншотов при возникновении ошибок установите `html2canvas-pro`:

```bash
npm install html2canvas-pro
```

**Примечание:** Скриншоты будут работать и без `html2canvas-pro`, но с ограниченной функциональностью. Для полноценных скриншотов страниц с поддержкой современных CSS цветов (oklch, lab, lch и др.) рекомендуется установить `html2canvas-pro`.

### Быстрый старт

```typescript
import { init } from "fast-analytics-js";

init({
  projectKey: "your-project-api-key",
  // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
});
```

**Всё!** SDK автоматически перехватывает все ошибки без необходимости писать код логирования вручную.

**Получение API-ключа:** Зарегистрируйтесь на [https://fast-analytics.vercel.app/](https://fast-analytics.vercel.app/), чтобы получить API-ключ вашего проекта.

### Возможности

- ✅ **Автоматический перехват ошибок** - Не требует изменений в коде
- ✅ **Скриншоты ошибок** - Автоматические скриншоты при возникновении ошибок (опционально)
- ✅ **Отслеживание посещений страниц** - Автоматическое отслеживание маршрутов в SPA
- ✅ **Отслеживание онлайн пользователей** - Отслеживание количества пользователей онлайн в реальном времени
- ✅ **Управление сессиями** - Автоматическое отслеживание сессий
- ✅ **Батчинг событий** - Эффективная пакетная обработка событий
- ✅ **Предотвращение дубликатов** - Автоматическое обнаружение дубликатов и подсчет повторений
- ✅ **Поддержка TypeScript** - Полные определения типов включены
- ✅ **Нулевые зависимости** - Легковесный и быстрый (html2canvas-pro опционален)
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
- Счетчик онлайн пользователей в реальном времени
- Обнаружение дубликатов ошибок и подсчет повторений

### Автоматический перехват ошибок

По умолчанию SDK автоматически перехватывает **все ошибки** без необходимости писать код логирования:

- ✅ **Ошибки JavaScript** (`window.onerror`) - синтаксические ошибки, ошибки выполнения и т.д.
- ✅ **Необработанные промисы** (`unhandledrejection`) - асинхронные ошибки
- ✅ **Ошибки загрузки ресурсов** - неудачная загрузка изображений, скриптов или стилей
- ✅ **Ошибки HTTP-запросов** - неудачные fetch/XHR запросы (статусы 4xx, 5xx)
- ✅ **Сетевые ошибки** - сбои соединения, таймауты и т.д.

**Вам не нужно вручную оборачивать код в try-catch блоки или добавлять обработчики ошибок** - SDK делает всё автоматически!

**Примечание:** SDK автоматически исключает свои собственные API-запросы из отслеживания ошибок, чтобы предотвратить бесконечные циклы.

### Предотвращение дубликатов ошибок

Бэкенд Fast Analytics автоматически предотвращает создание дублирующихся логов:

- **Автоматическое обнаружение** - При создании события система проверяет, существует ли уже событие с такими же `url` и `context` в рамках проекта
- **Подсчет повторений** - Если дубликат найден, вместо создания нового события система увеличивает счетчик `occurrenceCount` существующего события
- **Видимость** - Количество повторений отображается в таблице логов и детальном просмотре, что позволяет легко видеть, какие ошибки происходят чаще всего

Это помогает:

- Предотвратить переполнение базы данных повторяющимися ошибками
- Быстро выявлять наиболее частые проблемы
- Сократить требования к хранилищу

**Вам не нужно ничего делать** - предотвращение дубликатов работает автоматически!

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

#### Группировка посещений страниц

Вы можете группировать посещения страниц по паттернам URL для консолидации данных аналитики. Это полезно для страниц с динамическими ID или параметрами, которые вы хотите отслеживать как одну страницу.

**Пример 1: Группировка всех страниц под путём**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: ["/example/*"], // Все посещения /example/* будут сгруппированы как "/example"
});
```

Все посещения `/example/page1`, `/example/page2`, `/example/123` будут отслеживаться как `/example`.

**Пример 2: Группировка страниц с динамическими ID**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: ["/example/*/some"], // Посещения типа /example/123/some, /example/456/some будут сгруппированы как "/example/*/some"
});
```

Все посещения `/example/123/some`, `/example/456/some`, `/example/789/some` будут отслеживаться как `/example/*/some`.

**Пример 3: Несколько паттернов**

```typescript
init({
  projectKey: "your-project-api-key",
  groupPageVisitsGroup: [
    "/example/*",
    "/products/*/details",
    "/users/*/profile",
  ],
});
```

**Правила сопоставления паттернов:**

- `"/example/*"` - Группирует все URL, начинающиеся с `/example/`, в `/example`
- `"/example/*/some"` - Группирует URL типа `/example/123/some` в `/example/*/some`
- Паттерны проверяются по порядку, используется первое совпадение
- Используйте `*` как подстановочный знак для соответствия любому сегменту пути

### Отслеживание онлайн пользователей

По умолчанию SDK автоматически отслеживает онлайн пользователей в реальном времени:

- ✅ **Автоматический heartbeat** - Отправляет периодические сигналы heartbeat для отслеживания активных пользователей
- ✅ **Счетчик в реальном времени** - Просматривайте текущее количество онлайн пользователей в панели управления
- ✅ **Отслеживание по сессиям** - Каждая сессия отслеживается независимо
- ✅ **Автоматическая очистка** - Неактивные пользователи автоматически удаляются через 60 секунд

**Вам не нужно вручную отслеживать онлайн пользователей** - SDK делает всё автоматически!

SDK отправляет сигналы heartbeat каждые 30 секунд (настраивается через `heartbeatInterval`), чтобы указать, что пользователь активен. Пользователи считаются онлайн, если они отправили heartbeat в течение последних 60 секунд.

#### Отключение отслеживания онлайн пользователей

Если вы хотите отключить отслеживание онлайн пользователей:

```typescript
init({
  projectKey: "your-project-api-key",
  enableOnlineTracking: false, // Отключить отслеживание онлайн пользователей
});
```

#### Настройка интервала heartbeat

Вы можете настроить частоту отправки сигналов heartbeat:

```typescript
init({
  projectKey: "your-project-api-key",
  heartbeatInterval: 15000, // Отправлять heartbeat каждые 15 секунд
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
  enableOnlineTracking: true, // Опционально: Включить отслеживание онлайн пользователей (по умолчанию: true)
  enableScreenshotOnError: true, // Опционально: Включить автоматические скриншоты при ошибках (по умолчанию: false)
  batchSize: 10, // Опционально: Размер батча для отправки событий (по умолчанию: 10)
  batchTimeout: 5000, // Опционально: Таймаут отправки батча в мс (по умолчанию: 5000)
  heartbeatInterval: 30000, // Опционально: Интервал heartbeat для отслеживания онлайн в мс (по умолчанию: 30000)
  ignoreError: {
    // Опционально: Игнорировать определённые ошибки
    codes: [404, 500], // Игнорировать ошибки с этими статус-кодами
    urls: ["/example/*"], // Игнорировать ошибки с этих паттернов URL
  },
  groupPageVisitsGroup: ["/example/*"], // Опционально: Группировать посещения страниц по паттернам URL
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

### Игнорирование ошибок

Вы можете настроить SDK для игнорирования определённых ошибок на основе кодов ошибок или паттернов URL. Это полезно для фильтрации известных ошибок, которые вы не хотите отслеживать.

#### Игнорирование по коду ошибки

Игнорировать ошибки с определёнными HTTP статус-кодами:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    codes: [404, 500, "403"], // Игнорировать ошибки со статус-кодами 404, 500 и 403
  },
});
```

#### Игнорирование по паттерну URL

Игнорировать ошибки с определённых URL используя паттерны с подстановочными знаками:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    urls: [
      "/example/*", // Игнорировать все ошибки на путях /example/*
      "/api/health", // Точное совпадение
      "*.jpg", // Все изображения
      "/admin/*/test", // Паттерн с * в середине
    ],
  },
});
```

#### Комбинированные правила игнорирования

Вы можете комбинировать коды ошибок и паттерны URL. Ошибка будет проигнорирована, если она соответствует любому из условий:

```typescript
init({
  projectKey: "your-project-api-key",
  ignoreError: {
    codes: [404, 500],
    urls: ["/example/*", "/api/health"],
  },
});
```

**Сопоставление паттернов:**

- `"/example/*"` - Совпадает со всеми URL, начинающимися с `/example/` (например, `/example/page`, `/example/123`)
- `"*.jpg"` - Совпадает со всеми URL, заканчивающимися на `.jpg`
- `"/admin/*/test"` - Совпадает с URL типа `/admin/users/test`, `/admin/posts/test`
- Точное совпадение: `"/api/health"` - Совпадает только с `/api/health`

### Скриншоты ошибок

SDK может автоматически создавать скриншоты при возникновении ошибок. Это помогает увидеть точно то, что видел пользователь, когда произошла ошибка.

#### Включение скриншотов

```typescript
init({
  projectKey: "your-project-api-key",
  enableScreenshotOnError: true, // Включить автоматические скриншоты при ошибках
});
```

#### Установка html2canvas-pro (Рекомендуется)

Для полноценной функциональности скриншотов установите `html2canvas-pro`:

```bash
npm install html2canvas-pro
```

**Без `html2canvas-pro`:** SDK будет использовать упрощённый метод, который создаёт базовый скриншот с ограниченной функциональностью.

**С `html2canvas-pro`:** SDK будет создавать полноценные скриншоты страниц со всеми стилями и контентом, отрендеренными корректно, включая поддержку современных CSS цветов (oklch, lab, lch и др.).

Скриншоты автоматически прикрепляются к событиям ошибок и могут быть просмотрены в панели управления Fast Analytics.

### Принудительная отправка событий

Отправить все накопленные события немедленно (полезно перед закрытием страницы или остановкой приложения):

```typescript
import { flush } from "fast-analytics-js";

// Отправить все накопленные события немедленно
await flush();
```

**Примечание:** SDK автоматически отправляет события при закрытии страницы (`beforeunload`) или когда вкладка становится скрытой (`visibilitychange`). Вам не нужно вручную настраивать эти обработчики.

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

### Справочник API

#### Функции

##### `init(options: InitOptions): void`

Инициализирует SDK с предоставленными параметрами конфигурации. Должна быть вызвана перед использованием любых других функций SDK.

```typescript
init({
  projectKey: "your-project-api-key",
  // ... другие опции
});
```

##### `logError(error: Error | string, context?: EventContext): Promise<void>`

Вручную логировать ошибку. Принимает объект Error или строковое сообщение.

```typescript
await logError(new Error("Что-то пошло не так"), {
  userId: "user123",
  customTags: { section: "checkout" },
});
```

##### `logWarning(message: string, context?: EventContext): Promise<void>`

Логировать предупреждение.

```typescript
await logWarning("Обнаружено необычное поведение пользователя", {
  userId: "user123",
});
```

##### `logInfo(message: string, context?: EventContext): Promise<void>`

Логировать информационное сообщение.

```typescript
await logInfo("Пользователь завершил оформление заказа", {
  userId: "user123",
  orderId: "order-123",
});
```

##### `logDebug(message: string, context?: EventContext): Promise<void>`

Логировать отладочное сообщение.

```typescript
await logDebug("Отладочная информация", {
  data: someData,
});
```

##### `trackPageVisit(url?: string, pathname?: string, referrer?: string): Promise<void>`

Вручную отследить посещение страницы. При вызове без аргументов использует информацию о текущей странице.

```typescript
await trackPageVisit(
  "https://example.com/page",
  "/page",
  "https://example.com/referrer"
);
```

##### `flush(): Promise<void>`

Немедленно отправить все накопленные события из очереди батчей.

```typescript
await flush();
```

##### `getSessionId(): string`

Получить ID текущей сессии.

```typescript
const sessionId = getSessionId();
```

##### `resetSession(): void`

Создать новую сессию (генерирует новый ID сессии).

```typescript
resetSession();
```

##### `teardown(): void`

Очистить и отключить SDK. Удаляет все обработчики событий и останавливает отслеживание.

```typescript
teardown();
```

#### Типы

##### `InitOptions`

Параметры конфигурации для инициализации SDK.

```typescript
interface InitOptions {
  projectKey: string; // Обязательно: API-ключ вашего проекта
  endpoint?: string; // Опционально: URL API endpoint
  userId?: string; // Опционально: Глобальный ID пользователя для всех событий
  enableAutoCapture?: boolean; // Опционально: Включить автоматический перехват (по умолчанию: true)
  enablePageTracking?: boolean; // Опционально: Включить отслеживание посещений (по умолчанию: true)
  enableOnlineTracking?: boolean; // Опционально: Включить отслеживание онлайн пользователей (по умолчанию: true)
  enableScreenshotOnError?: boolean; // Опционально: Включить скриншоты при ошибках (по умолчанию: false)
  batchSize?: number; // Опционально: Размер батча для событий (по умолчанию: 10)
  batchTimeout?: number; // Опционально: Таймаут батча в мс (по умолчанию: 5000)
  heartbeatInterval?: number; // Опционально: Интервал heartbeat в мс (по умолчанию: 30000)
  ignoreError?: {
    codes?: (string | number)[]; // HTTP статус-коды для игнорирования
    urls?: string[]; // Паттерны URL для игнорирования
  };
  groupPageVisitsGroup?: string[]; // Паттерны URL для группировки посещений страниц
}
```

##### `EventContext`

Дополнительные данные контекста для событий.

```typescript
interface EventContext {
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  customTags?: Record<string, string>;
  [key: string]: unknown; // Любые дополнительные пользовательские данные
}
```

##### `EventLevel`

Уровень логирования для событий.

```typescript
type EventLevel = "error" | "warn" | "info" | "debug";
```

##### `EventPayload`

Полная структура полезной нагрузки события.

```typescript
interface EventPayload {
  level: EventLevel;
  message: string;
  stack?: string;
  context?: EventContext;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  performance?: EventPerformance;
  screenshotUrl?: string;
}
```

##### `PageVisitPayload`

Полезная нагрузка события посещения страницы.

```typescript
interface PageVisitPayload {
  url: string;
  pathname?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  duration?: number; // Время, проведенное на странице в миллисекундах
}
```

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
import { init } from "fast-analytics-js";

function App() {
  useEffect(() => {
    init({
      projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
      // endpoint опционально - по умолчанию "https://fast-analytics.vercel.app/api/events"
      // endpoint: process.env.NEXT_PUBLIC_FAST_ANALYTICS_ENDPOINT
      enableScreenshotOnError: true, // Опционально: Включить скриншоты ошибок
      batchSize: 10, // Опционально: Настроить размер батча
    });
    // События автоматически отправляются при закрытии страницы - дополнительная настройка не требуется!
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
  // События автоматически отправляются при закрытии страницы - дополнительная настройка не требуется!
</script>
```

### Совместимость с браузерами

SDK работает во всех современных браузерах, которые поддерживают:

- Функции JavaScript ES6+
- API `fetch` (или полифилл)
- API `sessionStorage`
- API `History` (для SPA маршрутизации)

**Поддерживаемые браузеры:**

- Chrome/Edge: Последние 2 версии
- Firefox: Последние 2 версии
- Safari: Последние 2 версии
- Opera: Последние 2 версии
- Мобильные браузеры: iOS Safari 12+, Chrome Mobile

**Примечание:** Для старых браузеров может потребоваться включить полифиллы для `fetch` и `Promise`.

### Часто задаваемые вопросы

#### Как работает пакетная обработка?

События собираются в батчи и отправляются когда:

- Батч достигает `batchSize` событий (по умолчанию: 10), или
- Прошло `batchTimeout` миллисекунд (по умолчанию: 5000мс)

Это уменьшает количество сетевых запросов и улучшает производительность. Вы можете настроить эти значения в опциях `init()`.

#### Повлияет ли SDK на производительность моего приложения?

SDK разработан для того, чтобы быть легковесным и ненавязчивым:

- События отправляются асинхронно
- Пакетная обработка уменьшает сетевую нагрузку
- Скриншоты создаются только при возникновении ошибок (если включено)
- Все операции неблокирующие

#### Как отслеживаются сессии?

Сессии автоматически отслеживаются с использованием `sessionStorage`. Каждая сессия имеет уникальный ID, который сохраняется при перезагрузке страницы в той же вкладке браузера. Сессии сбрасываются когда:

- Вкладка браузера закрывается
- `resetSession()` вызывается вручную
- Пользователь очищает хранилище браузера

#### Могу ли я использовать этот SDK в окружении Node.js?

SDK разработан для браузерных окружений. Некоторые функции (например, отслеживание страниц, скриншоты) требуют браузерных API. Для отслеживания ошибок на стороне сервера рассмотрите использование другого SDK или API клиента.

#### Как протестировать SDK в разработке?

Вы можете использовать функцию `teardown()` для отключения SDK во время тестов:

```typescript
import { init, teardown } from "fast-analytics-js";

beforeEach(() => {
  init({ projectKey: "test-key" });
});

afterEach(() => {
  teardown();
});
```

#### Что происходит, если сеть недоступна?

События ставятся в очередь в батчах и будут отправлены при восстановлении соединения. SDK не сохраняет события в локальное хранилище, поэтому события могут быть потеряны, если страница закрыта в офлайн режиме.

#### Могу ли я настроить формат сообщения об ошибке?

SDK автоматически форматирует сообщения об ошибках и трассировки стека. Вы можете добавить дополнительный контекст, используя параметр `context` в функциях логирования, который будет включен в полезную нагрузку события.

#### Как обнаруживаются дубликаты ошибок?

Бэкенд автоматически обнаруживает дубликаты, сравнивая поля `url` и `context`. Когда дубликат найден, счетчик `occurrenceCount` увеличивается вместо создания нового события.

---

### Browser Compatibility

The SDK works in all modern browsers that support:

- ES6+ JavaScript features
- `fetch` API (or polyfill)
- `sessionStorage` API
- `History` API (for SPA routing)

**Supported browsers:**

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Opera: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

**Note:** For older browsers, you may need to include polyfills for `fetch` and `Promise`.

### FAQ

#### How does batch processing work?

Events are collected in batches and sent when either:

- The batch reaches `batchSize` events (default: 10), or
- `batchTimeout` milliseconds have passed (default: 5000ms)

This reduces network requests and improves performance. You can customize these values in `init()` options.

#### Will the SDK affect my app's performance?

The SDK is designed to be lightweight and non-intrusive:

- Events are sent asynchronously
- Batch processing reduces network overhead
- Screenshots are only created when errors occur (if enabled)
- All operations are non-blocking

#### How are sessions tracked?

Sessions are automatically tracked using `sessionStorage`. Each session has a unique ID that persists across page reloads within the same browser tab. Sessions are reset when:

- The browser tab is closed
- `resetSession()` is called manually
- The user clears browser storage

#### Can I use this SDK in a Node.js environment?

The SDK is designed for browser environments. Some features (like page tracking, screenshots) require browser APIs. For server-side error tracking, consider using a different SDK or API client.

#### How do I test the SDK in development?

You can use the `teardown()` function to disable the SDK during tests:

```typescript
import { init, teardown } from "fast-analytics-js";

beforeEach(() => {
  init({ projectKey: "test-key" });
});

afterEach(() => {
  teardown();
});
```

#### What happens if the network is offline?

Events are queued in batches and will be sent when the connection is restored. The SDK doesn't persist events to local storage, so events may be lost if the page is closed while offline.

#### Can I customize the error message format?

The SDK automatically formats error messages and stack traces. You can add additional context using the `context` parameter in logging functions, which will be included in the event payload.

#### How are duplicate errors detected?

The backend automatically detects duplicates by comparing `url` and `context` fields. When a duplicate is found, the `occurrenceCount` is incremented instead of creating a new event.

---

## License

MIT
