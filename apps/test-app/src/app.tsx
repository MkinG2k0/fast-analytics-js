import { useEffect, useState } from 'react'
import {
	init,
	logError,
	logInfo,
	logWarning,
	logDebug,
	getSessionId,
} from '@fast-analytics/sdk'

export const App = () => {
	const [sessionId, setSessionId] = useState<string>('')
	const [projectKey, setProjectKey] = useState<string>(
		'fa_e153bc3419757ed5384c4eb53ba2d24d94f58b0d7089c08f14e63250c8030be1',
	)
	const [endpoint, setEndpoint] = useState<string>(
		localStorage.getItem('href') || 'http://localhost:3000/api/events',
	)
	const [userId, setUserIdState] = useState<string>(
		`Kama-${new Date().getTime().toString(36).substring(0, 4)}`,
	)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		if (isInitialized) {
			setSessionId(getSessionId())
		}
	}, [isInitialized])

	const handleInit = () => {
		if (!projectKey || !endpoint) {
			alert('Пожалуйста, заполните Project Key и Endpoint')
			return
		}

		init({
			projectKey,
			endpoint,
			enableAutoCapture: true,
			batchSize: 10,
			batchTimeout: 5000,
			userId: userId || undefined,
		})

		setIsInitialized(true)
		setSessionId(getSessionId())
	}

	const handleTestError = () => {
		try {
			throw new Error('Тестовая ошибка для проверки SDK')
		} catch (error) {
			logError(error as Error, {
				customTags: {
					test: 'true',
					component: 'App',
				},
			})
		}
	}

	const handleTestStringError = () => {
		logError('Тестовая строковая ошибка', {
			customTags: {
				test: 'true',
				type: 'string',
			},
		})
	}

	const handleTestWarning = () => {
		logWarning('Тестовое предупреждение', {
			customTags: {
				test: 'true',
				level: 'warning',
			},
		})
	}

	const handleTestInfo = () => {
		logInfo('Тестовое информационное сообщение', {
			customTags: {
				test: 'true',
				level: 'info',
			},
		})
	}

	const handleTestDebug = () => {
		logDebug('Тестовое отладочное сообщение', {
			customTags: {
				test: 'true',
				level: 'debug',
			},
		})
	}

	const handleAsyncError = async () => {
		try {
			await Promise.reject(new Error('Асинхронная ошибка'))
		} catch (error) {
			logError(error as Error, {
				customTags: {
					test: 'true',
					type: 'async',
				},
			})
		}
	}

	// Тест автоматического перехвата синхронной ошибки
	const handleAutoSyncError = () => {
		// Вызываем ошибку без try-catch - должна быть перехвачена автоматически
		throw new Error('Автоматически перехваченная синхронная ошибка')
	}

	// Тест автоматического перехвата необработанного промиса
	const handleAutoUnhandledPromise = () => {
		// Создаем промис, который отклоняется без обработки
		Promise.reject(
			new Error('Автоматически перехваченный необработанный промис'),
		)
	}

	// Тест автоматического перехвата ошибки загрузки ресурса
	const handleAutoResourceError = () => {
		// Создаем изображение с несуществующим URL
		const img = new Image()
		img.src = 'https://example.com/nonexistent-image-12345.png'
		img.onerror = () => {
			// Ошибка должна быть перехвачена автоматически
		}
	}

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
		})
	}

	return (
		<div style={{padding: '2rem', maxWidth: '800px', margin: '0 auto'}}>
			<h1>Fast Analytics SDK Test App</h1>

			<div
				style={{
					marginBottom: '2rem',
					padding: '1rem',
					border: '1px solid #ccc',
					borderRadius: '8px',
				}}
			>
				<h2>Инициализация SDK</h2>
				<div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
					<div>
						<label style={{display: 'block', marginBottom: '0.5rem'}}>
							Project Key:
						</label>
						<input
							type="text"
							value={projectKey}
							onChange={(e) => setProjectKey(e.target.value)}
							placeholder="Введите project key"
							style={{width: '100%', padding: '0.5rem'}}
							disabled={isInitialized}
						/>
					</div>
					<div>
						<label style={{display: 'block', marginBottom: '0.5rem'}}>
							Endpoint:
						</label>
						<input
							type="text"
							value={endpoint}
							onChange={(e) => {

								setEndpoint(e.target.value)

								localStorage.setItem('href', e.target.value)
							}}
							placeholder="http://localhost:3000/api/events"
							style={{width: '100%', padding: '0.5rem'}}
							disabled={isInitialized}
						/>
					</div>
					<div>
						<label style={{display: 'block', marginBottom: '0.5rem'}}>
							User ID (опционально):
						</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserIdState(e.target.value)}
							placeholder="Введите user ID"
							style={{width: '100%', padding: '0.5rem'}}
							disabled={isInitialized}
						/>
					</div>
					<button
						onClick={handleInit}
						disabled={isInitialized}
						style={{
							padding: '0.75rem 1.5rem',
							backgroundColor: isInitialized ? '#ccc' : '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: isInitialized ? 'not-allowed' : 'pointer',
						}}
					>
						{isInitialized ? 'SDK инициализирован' : 'Инициализировать SDK'}
					</button>
					{isInitialized && (
						<div
							style={{
								marginTop: '1rem',
								padding: '0.5rem',
								backgroundColor: '#e7f3ff',
								borderRadius: '4px',
							}}
						>
							<div style={{marginBottom: '0.5rem'}}>
								<strong>Session ID:</strong> {sessionId}
							</div>
							<div>
								<strong>User ID:</strong> {userId || 'не установлен'}
							</div>
						</div>
					)}
				</div>
			</div>

			{isInitialized && (
				<div
					style={{
						marginBottom: '2rem',
						padding: '1rem',
						border: '1px solid #ccc',
						borderRadius: '8px',
					}}
				>
					<h2>Тестирование логирования</h2>
					<div
						style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}
					>
						<button
							onClick={handleTestError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Error (Exception)
						</button>
						<button
							onClick={handleTestStringError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Error (String)
						</button>
						<button
							onClick={handleAsyncError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Async Error
						</button>
						<button
							onClick={handleRequestError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Request Error
						</button>
						<button
							onClick={handleTestWarning}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#ffc107',
								color: 'black',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Warning
						</button>
						<button
							onClick={handleTestInfo}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#17a2b8',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Info
						</button>
						<button
							onClick={handleTestDebug}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#6c757d',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест Debug
						</button>
					</div>
				</div>
			)}

			{isInitialized && (
				<div
					style={{
						marginBottom: '2rem',
						padding: '1rem',
						border: '1px solid #28a745',
						borderRadius: '8px',
						backgroundColor: '#f0f9ff',
					}}
				>
					<h2>Тестирование автоматического перехвата ошибок</h2>
					<p style={{marginBottom: '1rem', color: '#666'}}>
						Эти ошибки должны быть автоматически перехвачены SDK без явного
						вызова logError()
					</p>
					<div
						style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}
					>
						<button
							onClick={handleAutoSyncError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест авто-перехвата синхронной ошибки
						</button>
						<button
							onClick={handleAutoUnhandledPromise}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест авто-перехвата необработанного промиса
						</button>
						<button
							onClick={handleAutoResourceError}
							style={{
								padding: '0.75rem 1.5rem',
								backgroundColor: '#dc3545',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Тест авто-перехвата ошибки загрузки ресурса
						</button>
					</div>
				</div>
			)}

			{!isInitialized && (
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#fff3cd',
						borderRadius: '4px',
						color: '#856404',
					}}
				>
					Сначала инициализируйте SDK, указав Project Key и Endpoint
				</div>
			)}
		</div>
	)
}
