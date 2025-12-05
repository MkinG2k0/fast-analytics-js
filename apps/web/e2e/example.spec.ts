import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./fixtures/api-mocks";

test.describe("Главная страница", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("должна перенаправлять на /projects", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/projects/);
  });
});

test.describe("Страница входа", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("должна отображать форму входа", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form, .ant-card")).toBeVisible();
  });
});

test.describe("Страница регистрации", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("должна отображать форму регистрации", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
  });
});
