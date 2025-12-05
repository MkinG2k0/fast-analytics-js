import { Page } from "@playwright/test";
import { mockUser, mockProjects, mockEvents, mockToken } from "./mocks";

export async function mockAuthApi(page: Page) {
  // Мокируем регистрацию
  await page.route("**/api/auth/register", async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email === "exists@example.com") {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Пользователь с таким email уже существует" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          ...mockUser,
          email: postData?.email || mockUser.email,
          name: postData?.name || mockUser.name,
        },
        token: mockToken,
      }),
    });
  });

  // Мокируем логин
  await page.route("**/api/auth/login", async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.email === "wrong@example.com" || postData?.password === "wrong") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Неверный email или пароль" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: mockUser,
        token: mockToken,
      }),
    });
  });

  // Мокируем NextAuth сессию
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

  // Мокируем NextAuth callback для credentials
  await page.route("**/api/auth/callback/credentials*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // Мокируем NextAuth signin
  await page.route("**/api/auth/signin*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
}

export async function mockProjectsApi(page: Page) {
  // Мокируем получение списка проектов
  await page.route("**/api/projects", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProjects),
      });
      return;
    }

    // Мокируем создание проекта
    if (route.request().method() === "POST") {
      const request = route.request();
      const postData = request.postDataJSON();

      const newProject = {
        id: `project-${Date.now()}`,
        name: postData?.name || "Новый проект",
        description: postData?.description || null,
        apiKey: `api-key-${Date.now()}`,
        userId: mockUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(newProject),
      });
    }
  });

  // Мокируем получение конкретного проекта
  await page.route("**/api/projects/*", async (route) => {
    const url = route.request().url();
    const projectId = url.split("/api/projects/")[1]?.split("?")[0];

    if (route.request().method() === "GET") {
      const project = mockProjects.find((p) => p.id === projectId) || mockProjects[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(project),
      });
    }
  });
}

export async function mockEventsApi(page: Page) {
  // Мокируем получение событий
  await page.route("**/api/events*", async (route) => {
    const url = new URL(route.request().url());
    const projectId = url.searchParams.get("projectId");

    if (route.request().method() === "GET") {
      const filteredEvents = projectId
        ? mockEvents.filter((e) => e.projectId === projectId)
        : mockEvents;

      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const start = (page - 1) * limit;
      const end = start + limit;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: filteredEvents.slice(start, end),
          total: filteredEvents.length,
          page,
          limit,
        }),
      });
      return;
    }
  });

  // Мокируем получение конкретного события
  await page.route("**/api/events/*", async (route) => {
    const url = route.request().url();
    const eventId = url.split("/api/events/")[1]?.split("?")[0];

    if (route.request().method() === "GET") {
      const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(event),
      });
    }

    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    }
  });
}

export async function setupApiMocks(page: Page) {
  await mockAuthApi(page);
  await mockProjectsApi(page);
  await mockEventsApi(page);
}

