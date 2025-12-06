/**
 * Создает скриншот текущей страницы в формате base64
 * @returns Promise с base64 строкой изображения или null в случае ошибки
 */
export async function createScreenshot(): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  try {
    // Пытаемся использовать html2canvas-pro, если он доступен
    // Это опциональная зависимость, которую пользователь может установить
    // html2canvas-pro поддерживает современные CSS цвета (oklch, lab, lch и др.)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const html2canvas = await import("html2canvas-pro");

      if (html2canvas && html2canvas.default) {
        const canvas = await html2canvas.default(document.body, {
          allowTaint: true,
          useCORS: true,
          logging: false,
          scale: 0.8, // Уменьшаем размер для экономии места
          backgroundColor: "#ffffff",
        });

        return canvas.toDataURL("image/png", 0.8);
      }
    } catch (importError) {
      // html2canvas-pro не установлен или не может быть импортирован
      // Используем fallback
    }

    // Fallback: простой скриншот через canvas (ограниченный функционал)
    return createSimpleScreenshot();
  } catch (error) {
    console.warn("[Fast Analytics SDK] Ошибка создания скриншота:", error);
    // При любой ошибке пытаемся вернуть хотя бы упрощенный скриншот
    return createSimpleScreenshot();
  }
}

/**
 * Простой fallback метод создания скриншота
 * Работает только для видимой области экрана
 */
function createSimpleScreenshot(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Рисуем белый фон
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Пытаемся захватить видимую область
    // Это очень ограниченный метод, но лучше чем ничего
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.fillText(`Скриншот недоступен. URL: ${window.location.href}`, 10, 20);

    return canvas.toDataURL("image/png", 0.8);
  } catch {
    return null;
  }
}
