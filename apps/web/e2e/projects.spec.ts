import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/api-mocks";
import { mockProjects } from "./fixtures/mocks";

test.describe("Проекты", () => {
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

  test("должна отображать список проектов", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByRole("heading", { name: "Проекты" })).toBeVisible();
    await expect(
      page.locator("text=Управление вашими проектами аналитики")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Создать проект" })
    ).toBeVisible();

    // Проверяем наличие проектов в таблице
    for (const project of mockProjects) {
      await expect(page.locator(`text=${project.name}`)).toBeVisible();
    }
  });

  test("должна показывать пустое состояние при отсутствии проектов", async ({
    page,
  }) => {
    // Мокируем пустой список проектов
    await page.route("**/api/projects", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto("/projects");

    await expect(page.locator("text=У вас пока нет проектов")).toBeVisible();
    await expect(
      page.locator(
        "text=Создайте первый проект, чтобы начать отслеживать события"
      )
    ).toBeVisible();
  });

  test("должна открывать модальное окно создания проекта", async ({ page }) => {
    await page.goto("/projects");

    await page.click('button:has-text("Создать проект")');

    await expect(page.locator("text=Создать новый проект")).toBeVisible();
    await expect(
      page.locator('input[placeholder="Например: Мой веб-сайт"]')
    ).toBeVisible();
    await expect(
      page.locator('textarea[placeholder="Краткое описание проекта..."]')
    ).toBeVisible();
  });

  test("должна валидировать форму создания проекта", async ({ page }) => {
    await page.goto("/projects");

    await page.click('button:has-text("Создать проект")');

    // Пытаемся отправить пустую форму - находим кнопку в модальном окне
    const submitButton = page
      .locator(".ant-modal")
      .getByRole("button", { name: "Создать проект" });
    await submitButton.click();

    await expect(
      page.locator("text=Пожалуйста, введите название проекта")
    ).toBeVisible();
  });

  test("должна показывать ошибку при коротком названии проекта", async ({
    page,
  }) => {
    await page.goto("/projects");

    await page.click('button:has-text("Создать проект")');
    await page.fill('input[placeholder="Например: Мой веб-сайт"]', "А");

    const submitButton = page
      .locator(".ant-modal")
      .getByRole("button", { name: "Создать проект" });
    await submitButton.click();

    await expect(
      page.locator("text=Название должно содержать минимум 2 символа")
    ).toBeVisible();
  });

  test("должна успешно создать проект", async ({ page }) => {
    await page.goto("/projects");

    await page.click('button:has-text("Создать проект")');
    await page.fill(
      'input[placeholder="Например: Мой веб-сайт"]',
      "Новый тестовый проект"
    );
    await page.fill(
      'textarea[placeholder="Краткое описание проекта..."]',
      "Описание проекта"
    );

    // Перехватываем обновление списка проектов
    const projectsRequest = page.waitForResponse(
      (response) =>
        response.url().includes("/api/projects") &&
        response.request().method() === "GET"
    );

    const submitButton = page
      .locator(".ant-modal")
      .getByRole("button", { name: "Создать проект" });
    await submitButton.click();

    // Ждем сообщение об успехе или закрытие модального окна
    // Сообщение может не отображаться, если быстро закрывается модальное окно
    await expect(
      page
        .locator("text=Проект успешно создан")
        .or(page.locator(".ant-modal", { hasNotText: "Создать новый проект" }))
    ).toBeVisible({ timeout: 5000 });

    // Ждем обновления списка
    await projectsRequest;

    // Проверяем, что модальное окно закрылось
    await expect(page.locator("text=Создать новый проект")).not.toBeVisible();
  });

  test("должна переходить на страницу логов проекта", async ({ page }) => {
    await page.goto("/projects");

    const firstProject = mockProjects[0];
    if (!firstProject) {
      throw new Error("No projects available");
    }

    // Находим строку таблицы с проектом и кнопку "Логи" в ней
    const projectRow = page
      .locator("tr")
      .filter({ hasText: firstProject.name });
    const logsButton = projectRow.getByRole("button", { name: "Логи" });

    await logsButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/project/${firstProject.id}/logs`)
    );
  });

  test("должна переходить на страницу настроек проекта", async ({ page }) => {
    await page.goto("/projects");

    const firstProject = mockProjects[0];
    if (!firstProject) {
      throw new Error("No projects available");
    }

    // Находим строку таблицы с проектом и кнопку "Настройки" в ней
    const projectRow = page
      .locator("tr")
      .filter({ hasText: firstProject.name });
    const settingsButton = projectRow.getByRole("button", {
      name: "Настройки",
    });

    await settingsButton.click();

    await expect(page).toHaveURL(
      new RegExp(`/project/${firstProject.id}/settings`)
    );
  });

  test("должна отображать пагинацию при большом количестве проектов", async ({
    page,
  }) => {
    // Мокируем много проектов
    const manyProjects = Array.from({ length: 25 }, (_, i) => ({
      id: `project-${i}`,
      name: `Проект ${i + 1}`,
      description: `Описание проекта ${i + 1}`,
      apiKey: `api-key-${i}`,
      userId: "user-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await page.route("**/api/projects", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(manyProjects),
        });
      }
    });

    await page.goto("/projects");

    await expect(page.locator("text=Всего проектов: 25")).toBeVisible();
  });
});
