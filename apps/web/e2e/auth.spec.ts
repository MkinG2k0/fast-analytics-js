import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/api-mocks";

test.describe("Авторизация", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("должна отображать страницу входа", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("text=Вход в систему")).toBeVisible();
    await expect(page.locator("text=Войти через Google")).toBeVisible();
  });

  test("должна перенаправлять на /projects после успешной авторизации", async ({
    page,
  }) => {
    await page.goto("/login");

    // Мокируем успешную авторизацию через NextAuth
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

    // Симулируем успешный вход (в реальности это делается через NextAuth)
    await page.evaluate(() => {
      window.localStorage.setItem(
        "nextauth.session",
        JSON.stringify({
          user: { id: "user-123", email: "test@example.com" },
        })
      );
    });

    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe("Регистрация", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("должна отображать форму регистрации", async ({ page }) => {
    await page.goto("/register");

    await expect(page.locator("text=Регистрация")).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Пароль"]')).toBeVisible();
    await expect(
      page.locator('input[placeholder="Подтвердите пароль"]')
    ).toBeVisible();
  });

  test("должна показывать ошибку при невалидном email", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[placeholder="Email"]', "invalid-email");
    await page.fill('input[placeholder="Пароль"]', "password123");
    await page.fill('input[placeholder="Подтвердите пароль"]', "password123");

    await page.click('button:has-text("Зарегистрироваться")');

    await expect(page.locator("text=Некорректный email")).toBeVisible();
  });

  test("должна показывать ошибку при коротком пароле", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[placeholder="Email"]', "test@example.com");
    await page.fill('input[placeholder="Пароль"]', "123");
    await page.fill('input[placeholder="Подтвердите пароль"]', "123");

    await page.click('button:has-text("Зарегистрироваться")');

    await expect(
      page.locator("text=Пароль должен быть не менее 6 символов")
    ).toBeVisible();
  });

  test("должна показывать ошибку при несовпадающих паролях", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill('input[placeholder="Email"]', "test@example.com");
    await page.fill('input[placeholder="Пароль"]', "password123");
    await page.fill('input[placeholder="Подтвердите пароль"]', "password456");

    await page.click('button:has-text("Зарегистрироваться")');

    await expect(page.locator("text=Пароли не совпадают")).toBeVisible();
  });

  test("должна успешно зарегистрировать пользователя", async ({ page }) => {
    // Мокируем NextAuth signIn для успешного входа после регистрации
    await page.route("**/api/auth/signin*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("callbackUrl")) {
        // Это запрос от signIn с callbackUrl
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<html><body>Redirecting...</body></html>",
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/register");

    await page.fill('input[placeholder="Email"]', "newuser@example.com");
    await page.fill('input[placeholder="Пароль"]', "password123");
    await page.fill('input[placeholder="Подтвердите пароль"]', "password123");

    // Перехватываем навигацию после успешной регистрации
    const navigationPromise = page.waitForURL(/\/projects/, { timeout: 15000 });

    await page.click('button:has-text("Зарегистрироваться")');

    // Ждем перенаправления (сообщение может не отображаться, если быстро редиректит)
    await navigationPromise;
    await expect(page).toHaveURL(/\/projects/);
  });

  test("должна показывать ошибку при регистрации с существующим email", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.fill('input[placeholder="Email"]', "exists@example.com");
    await page.fill('input[placeholder="Пароль"]', "password123");
    await page.fill('input[placeholder="Подтвердите пароль"]', "password123");

    await page.click('button:has-text("Зарегистрироваться")');

    // Ждем ответ от API с ошибкой
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/register") &&
        response.status() === 400,
      { timeout: 5000 }
    );

    // Ant Design показывает ошибки через message API
    // Проверяем наличие сообщения об ошибке (может быть в разных форматах)
    await expect(
      page
        .locator(".ant-message-error")
        .or(page.locator(".ant-notification-notice-error"))
        .or(page.locator("text=Пользователь с таким email уже существует"))
    ).toBeVisible({ timeout: 5000 });
  });

  test("должна иметь ссылку на страницу входа", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.locator('a:has-text("Уже есть аккаунт? Войти")');
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
