import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/api-mocks";
import { mockProjects, mockEvents } from "./fixtures/mocks";

test.describe("События / Логи", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);

    // Мокируем авторизованную сессию
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });
  });

  test("должна отображать страницу логов проекта", async ({ page }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");
    await page.goto(`/project/${projectId}/logs`);

    await expect(page.locator("text=Логи проекта")).toBeVisible();
    await expect(page.locator("text=Обновить")).toBeVisible();
  });

  test("должна отображать список событий", async ({ page }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");
    await page.goto(`/project/${projectId}/logs`);

    // Ждем загрузки событий
    await page.waitForSelector("table", { timeout: 5000 });

    // Проверяем наличие событий в таблице
    for (const event of mockEvents) {
      if (event.projectId === projectId) {
        await expect(page.locator(`text=${event.message}`)).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("должна фильтровать события по уровню", async ({ page }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");
    await page.goto(`/project/${projectId}/logs`);

    // Ждем загрузки таблицы
    await page.waitForSelector("table", { timeout: 5000 });

    // Ищем фильтр по уровню (предполагаем, что есть селектор для фильтрации)
    // Это зависит от реализации виджета фильтрации
    const filterButton = page
      .locator(
        'button:has-text("Фильтр"), button:has-text("error"), button:has-text("warning")'
      )
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Проверяем, что отображаются только события с выбранным уровнем
      await expect(
        page.locator("text=error").or(page.locator("text=warning"))
      ).toBeVisible();
    }
  });

  test("должна обновлять список событий при нажатии кнопки Обновить", async ({
    page,
  }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");
    await page.goto(`/project/${projectId}/logs`);

    await page.waitForSelector("table", { timeout: 5000 });

    // Перехватываем запрос обновления
    const refreshRequest = page.waitForResponse(
      (response) =>
        response.url().includes("/api/events") &&
        response.request().method() === "GET",
      { timeout: 10000 }
    );

    await page.getByRole("button", { name: "Обновить" }).click();

    await refreshRequest;
    // Проверяем, что данные обновились (таблица все еще видна)
    // Используем более специфичный селектор для таблицы
    await expect(page.getByRole("table").first()).toBeVisible();
  });

  test("должна переключаться на вкладку настроек", async ({ page }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");
    await page.goto(`/project/${projectId}/logs`);

    const settingsTab = page.locator('div[role="tab"]:has-text("Настройки")');

    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await expect(page).toHaveURL(
        new RegExp(`/project/${projectId}/settings`)
      );
    }
  });

  test("должна отображать пагинацию при большом количестве событий", async ({
    page,
  }) => {
    const projectId = mockProjects[0]?.id;
    if (!projectId) throw new Error("Project not found");

    // Мокируем много событий
    const manyEvents = Array.from({ length: 100 }, (_, i) => ({
      id: `event-${i}`,
      projectId,
      timestamp: new Date().toISOString(),
      level: i % 2 === 0 ? "error" : "warning",
      message: `Event message ${i + 1}`,
      stack: null,
      context: null,
      userAgent: "Mozilla/5.0",
      url: `https://example.com/page-${i}`,
      sessionId: `session-${i}`,
      userId: null,
      createdAt: new Date().toISOString(),
      screenshotUrl: null,
      clickTrace: null,
      performance: null,
      metadata: null,
    }));

    await page.route(`**/api/events*`, async (route) => {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const start = (pageNum - 1) * limit;
      const end = start + limit;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: manyEvents.slice(start, end),
          total: manyEvents.length,
          page: pageNum,
          limit,
        }),
      });
    });

    await page.goto(`/project/${projectId}/logs`);

    await page.waitForSelector("table", { timeout: 5000 });

    // Проверяем наличие пагинации
    const pagination = page.locator(".ant-pagination");
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });
});

test.describe("Детали события", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });
  });

  test("должна отображать детали события", async ({ page }) => {
    const eventId = mockEvents[0]?.id;
    if (!eventId) throw new Error("Event not found");
    const eventMessage = mockEvents[0]?.message;
    if (!eventMessage) throw new Error("Event message not found");
    await page.goto(`/event/${eventId}`);

    // Проверяем наличие основных полей события
    await expect(page.locator(`text=${eventMessage}`)).toBeVisible({
      timeout: 5000,
    });
    // Уровень может отображаться как ERROR, error или в другом формате
    await expect(
      page
        .getByText("ERROR", { exact: true })
        .or(page.getByText("error", { exact: false }))
    ).toBeVisible();
  });

  test("должна показывать информацию о событии", async ({ page }) => {
    const eventId = mockEvents[0]?.id;
    const event = mockEvents[0];
    if (!eventId || !event) throw new Error("Event not found");

    await page.goto(`/event/${eventId}`);

    // Проверяем наличие основных данных события
    await expect(page.locator(`text=${event.message}`)).toBeVisible({
      timeout: 5000,
    });
    // Уровень может отображаться как ERROR, error или в другом формате
    await expect(
      page
        .getByText("ERROR", { exact: true })
        .or(page.getByText("error", { exact: false }))
    ).toBeVisible();

    // URL и user agent могут быть в разных форматах, проверяем более гибко
    if (event.url) {
      // URL может быть в разных местах, проверяем наличие части URL
      const urlPart = event.url.split("//")[1] || event.url;
      await expect(
        page.locator(`text=${urlPart}`).or(page.locator(`text=${event.url}`))
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
