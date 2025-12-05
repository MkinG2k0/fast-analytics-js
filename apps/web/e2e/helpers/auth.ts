import { Page } from "@playwright/test";
import { mockUser } from "../fixtures/mocks";

/**
 * Устанавливает авторизованную сессию для тестов
 */
export async function setupAuthenticatedSession(page: Page) {
  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
  });

  // Устанавливаем cookie для NextAuth (если используется)
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: "mock-session-token",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

