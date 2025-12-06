import { useState, useEffect, useCallback } from "react";
import {
	logError,
	logWarning,
	logInfo,
	logDebug,
	trackPageVisit,
	getSessionId,
	resetSession,
	flush,
} from "fast-analytics-js";
import type { DemoEvent } from "../model";

export function useDemoSdk() {
	const [events, setEvents] = useState<DemoEvent[]>([]);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isFlushing, setIsFlushing] = useState(false);

	useEffect(() => {
		const currentSessionId = getSessionId();
		setSessionId(currentSessionId);
	}, []);

	const addEvent = useCallback((type: DemoEvent["type"], message: string) => {
		const newEvent: DemoEvent = {
			id: `${Date.now()}-${Math.random()}`,
			type,
			message,
			timestamp: new Date(),
		};
		setEvents((prev) => [newEvent, ...prev].slice(0, 20));
	}, []);

	const handleJavaScriptError = useCallback(() => {
		addEvent("error", "Сгенерирована JavaScript ошибка");
		setTimeout(() => {
			throw new Error("Демонстрационная JavaScript ошибка");
		}, 100);
	}, [addEvent]);

	const handlePromiseRejection = useCallback(() => {
		addEvent("error", "Сгенерирован необработанный промис");
		Promise.reject(new Error("Демонстрационная ошибка промиса"));
	}, [addEvent]);

	const handleReferenceError = useCallback(() => {
		addEvent("error", "Сгенерирована ReferenceError");
		setTimeout(() => {
			// @ts-expect-error - намеренная ошибка для демонстрации
			undefinedVariable.someMethod();
		}, 100);
	}, [addEvent]);

	const handleTypeError = useCallback(() => {
		addEvent("error", "Сгенерирована TypeError");
		setTimeout(() => {
			// @ts-expect-error - намеренная ошибка для демонстрации
			null.someMethod();
		}, 100);
	}, [addEvent]);

	const handleManualError = useCallback(() => {
		try {
			throw new Error("Ручная ошибка с контекстом");
		} catch (error) {
			logError(error as Error, {
				userId: "demo-user-123",
				customTags: {
					section: "demo",
					action: "manual_error",
					environment: "development",
				},
				url: window.location.href,
				orderId: "order-123",
				amount: 99.99,
			});
			addEvent("error", "Ручная ошибка отправлена в SDK");
		}
	}, [addEvent]);

	const handleWarning = useCallback(() => {
		logWarning("Демонстрационное предупреждение", {
			userId: "demo-user-123",
			customTags: {
				section: "demo",
				action: "warning",
			},
		});
		addEvent("warning", "Предупреждение отправлено в SDK");
	}, [addEvent]);

	const handleInfo = useCallback(() => {
		logInfo("Информационное сообщение", {
			userId: "demo-user-123",
			url: "/demo",
			customTags: {
				section: "demo",
				action: "info",
			},
		});
		addEvent("info", "Информационное сообщение отправлено в SDK");
	}, [addEvent]);

	const handleDebug = useCallback(() => {
		logDebug("Отладочная информация", {
			data: {
				timestamp: new Date().toISOString(),
				userAgent: navigator.userAgent,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight,
				},
			},
		});
		addEvent("debug", "Отладочное сообщение отправлено в SDK");
	}, [addEvent]);

	const handlePageVisit = useCallback(async () => {
		await trackPageVisit(
			window.location.href,
			window.location.pathname,
			document.referrer || undefined
		);
		addEvent("page-visit", "Посещение страницы отслежено");
	}, [addEvent]);

	const handleResetSession = useCallback(() => {
		resetSession();
		const newSessionId = getSessionId();
		setSessionId(newSessionId);
		addEvent("session", "Сессия сброшена, создана новая");
	}, [addEvent]);

	const handleFlush = useCallback(async () => {
		setIsFlushing(true);
		try {
			await flush();
			addEvent("info", "Все события отправлены (flush)");
		} catch (error) {
			addEvent("error", `Ошибка при flush: ${error}`);
		} finally {
			setIsFlushing(false);
		}
	}, [addEvent]);

	return {
		events,
		sessionId,
		isFlushing,
		handleJavaScriptError,
		handlePromiseRejection,
		handleReferenceError,
		handleTypeError,
		handleManualError,
		handleWarning,
		handleInfo,
		handleDebug,
		handlePageVisit,
		handleResetSession,
		handleFlush,
	};
}

