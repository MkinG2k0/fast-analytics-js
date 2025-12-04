import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { init, logError, logInfo, logWarning, logDebug, getSessionId, } from 'fast-analytics-js';
export const App = () => {
    const [sessionId, setSessionId] = useState('');
    const [projectKey, setProjectKey] = useState(localStorage.getItem('projectKey') || 'fa_test');
    const [endpoint, setEndpoint] = useState(localStorage.getItem('href') || 'http://localhost:3000/api/events');
    const [userId, setUserIdState] = useState(`Kama-${new Date().getTime().toString(36).substring(0, 4)}`);
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (isInitialized) {
            setSessionId(getSessionId());
        }
    }, [isInitialized]);
    const handleInit = () => {
        if (!projectKey || !endpoint) {
            alert('Пожалуйста, заполните Project Key и Endpoint');
            return;
        }
        init({
            projectKey,
            endpoint,
            enableAutoCapture: true,
            batchSize: 10,
            batchTimeout: 5000,
            userId: userId || undefined,
        });
        setIsInitialized(true);
        setSessionId(getSessionId());
    };
    const handleTestError = () => {
        try {
            throw new Error('Тестовая ошибка для проверки SDK');
        }
        catch (error) {
            logError(error, {
                customTags: {
                    test: 'true',
                    component: 'App',
                },
            });
        }
    };
    const handleTestStringError = () => {
        logError('Тестовая строковая ошибка', {
            customTags: {
                test: 'true',
                type: 'string',
            },
        });
    };
    const handleTestWarning = () => {
        logWarning('Тестовое предупреждение', {
            customTags: {
                test: 'true',
                level: 'warning',
            },
        });
    };
    const handleTestInfo = () => {
        logInfo('Тестовое информационное сообщение', {
            customTags: {
                test: 'true',
                level: 'info',
            },
        });
    };
    const handleTestDebug = () => {
        logDebug('Тестовое отладочное сообщение', {
            customTags: {
                test: 'true',
                level: 'debug',
            },
        });
    };
    const handleAsyncError = async () => {
        try {
            await Promise.reject(new Error('Асинхронная ошибка'));
        }
        catch (error) {
            logError(error, {
                customTags: {
                    test: 'true',
                    type: 'async',
                },
            });
        }
    };
    // Тест автоматического перехвата синхронной ошибки
    const handleAutoSyncError = () => {
        // Вызываем ошибку без try-catch - должна быть перехвачена автоматически
        throw new Error('Автоматически перехваченная синхронная ошибка');
    };
    // Тест автоматического перехвата необработанного промиса
    const handleAutoUnhandledPromise = () => {
        // Создаем промис, который отклоняется без обработки
        Promise.reject(new Error('Автоматически перехваченный необработанный промис'));
    };
    // Тест автоматического перехвата ошибки загрузки ресурса
    const handleAutoResourceError = () => {
        // Создаем изображение с несуществующим URL
        const img = new Image();
        img.src = 'https://example.com/nonexistent-image-12345.png';
        img.onerror = () => {
            // Ошибка должна быть перехвачена автоматически
        };
    };
    // Тест ошибки в HTTP-запросе
    const handleRequestError = async () => {
        // Делаем запрос на несуществующий эндпоинт или эндпоинт, который возвращает ошибку
        // await fetch("https://httpstat.us/500", {
        //   method: "GET",
        // });
        await fetch('https://jsonplaceholder.typicode.com/posts/asdasd', {
            method: 'POST',
            body: JSON.stringify({
                title: 'foo',
                body: 'bar',
                userId: 1,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });
    };
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '800px', margin: '0 auto' }, children: [_jsx("h1", { children: "Fast Analytics SDK Test App" }), _jsxs("div", { style: {
                    marginBottom: '2rem',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }, children: [_jsx("h2", { children: "\u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F SDK" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem' }, children: "Project Key:" }), _jsx("input", { type: "text", value: projectKey, onChange: (e) => {
                                            setProjectKey(e.target.value);
                                            localStorage.setItem('projectKey', e.target.value);
                                        }, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 project key", style: { width: '100%', padding: '0.5rem' }, disabled: isInitialized })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem' }, children: "Endpoint:" }), _jsx("input", { type: "text", value: endpoint, onChange: (e) => {
                                            setEndpoint(e.target.value);
                                            localStorage.setItem('href', e.target.value);
                                        }, placeholder: "http://localhost:3000/api/events", style: { width: '100%', padding: '0.5rem' }, disabled: isInitialized })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem' }, children: "User ID (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E):" }), _jsx("input", { type: "text", value: userId, onChange: (e) => setUserIdState(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 user ID", style: { width: '100%', padding: '0.5rem' }, disabled: isInitialized })] }), _jsx("button", { onClick: handleInit, disabled: isInitialized, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: isInitialized ? '#ccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isInitialized ? 'not-allowed' : 'pointer',
                                }, children: isInitialized ? 'SDK инициализирован' : 'Инициализировать SDK' }), isInitialized && (_jsxs("div", { style: {
                                    marginTop: '1rem',
                                    padding: '0.5rem',
                                    backgroundColor: '#e7f3ff',
                                    borderRadius: '4px',
                                }, children: [_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("strong", { children: "Session ID:" }), " ", sessionId] }), _jsxs("div", { children: [_jsx("strong", { children: "User ID:" }), " ", userId || 'не установлен'] })] }))] })] }), isInitialized && (_jsxs("div", { style: {
                    marginBottom: '2rem',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }, children: [_jsx("h2", { children: "\u0422\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043B\u043E\u0433\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [_jsx("button", { onClick: handleTestError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Error (Exception)" }), _jsx("button", { onClick: handleTestStringError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Error (String)" }), _jsx("button", { onClick: handleAsyncError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Async Error" }), _jsx("button", { onClick: handleRequestError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Request Error" }), _jsx("button", { onClick: handleTestWarning, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#ffc107',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Warning" }), _jsx("button", { onClick: handleTestInfo, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Info" }), _jsx("button", { onClick: handleTestDebug, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 Debug" })] })] })), isInitialized && (_jsxs("div", { style: {
                    marginBottom: '2rem',
                    padding: '1rem',
                    border: '1px solid #28a745',
                    borderRadius: '8px',
                    backgroundColor: '#f0f9ff',
                }, children: [_jsx("h2", { children: "\u0422\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0430 \u043E\u0448\u0438\u0431\u043E\u043A" }), _jsx("p", { style: { marginBottom: '1rem', color: '#666' }, children: "\u042D\u0442\u0438 \u043E\u0448\u0438\u0431\u043A\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0447\u0435\u043D\u044B SDK \u0431\u0435\u0437 \u044F\u0432\u043D\u043E\u0433\u043E \u0432\u044B\u0437\u043E\u0432\u0430 logError()" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [_jsx("button", { onClick: handleAutoSyncError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 \u0430\u0432\u0442\u043E-\u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u043E\u0439 \u043E\u0448\u0438\u0431\u043A\u0438" }), _jsx("button", { onClick: handleAutoUnhandledPromise, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 \u0430\u0432\u0442\u043E-\u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0430 \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u043C\u0438\u0441\u0430" }), _jsx("button", { onClick: handleAutoResourceError, style: {
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }, children: "\u0422\u0435\u0441\u0442 \u0430\u0432\u0442\u043E-\u043F\u0435\u0440\u0435\u0445\u0432\u0430\u0442\u0430 \u043E\u0448\u0438\u0431\u043A\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0440\u0435\u0441\u0443\u0440\u0441\u0430" })] })] })), !isInitialized && (_jsx("div", { style: {
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    color: '#856404',
                }, children: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 SDK, \u0443\u043A\u0430\u0437\u0430\u0432 Project Key \u0438 Endpoint" }))] }));
};
