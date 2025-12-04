import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs)
}

export function generateApiKey(): string {
	const prefix = 'fa_'
	const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
	return `${prefix}${randomBytes}`
}

export interface ParsedUrl {
	baseUrl: string;
	hash: string | null;
	params: Record<string, string>;
	hasParams: boolean;
}

function parseQueryString(queryString: string): Record<string, string> {
	const params: Record<string, string> = {}
	queryString.split('&').forEach((param) => {
		const [key, ...valueParts] = param.split('=')
		if (key) {
			try {
				params[key] = decodeURIComponent(valueParts.join('=') || '')
			} catch {
				params[key] = valueParts.join('=') || ''
			}
		}
	})
	return params
}

export function parseUrl(url: string): ParsedUrl {
	try {
		const urlObj = new URL(url)
		const params: Record<string, string> = {}

		// Парсим параметры из основного URL
		urlObj.searchParams.forEach((value, key) => {
			try {
				params[key] = decodeURIComponent(value)
			} catch {
				params[key] = value
			}
		})

		const baseUrl = urlObj.origin + urlObj.pathname
		let hash = urlObj.hash ? urlObj.hash.slice(1) : null

		// Парсим параметры из хеша (если они есть)
		if (hash) {
			const hashQueryIndex = hash.indexOf('?')
			if (hashQueryIndex !== -1) {
				const hashQueryString = hash.substring(hashQueryIndex + 1)
				hash = hash.substring(0, hashQueryIndex)
				const hashParams = parseQueryString(hashQueryString)
				Object.assign(params, hashParams)
			}
		}

		return {
			baseUrl,
			hash,
			params,
			hasParams: Object.keys(params).length > 0,
		}
	} catch {
		// Если URL невалидный, пытаемся парсить вручную
		try {
			const hashMatch = url.match(/#([^?]+)(\?.*)?/)
			const hash = hashMatch && hashMatch?.[1] ? hashMatch[1] : null
			const params: Record<string, string> = {}

			// Парсим параметры из основного URL
			const mainQueryMatch = url.match(/\?([^#]+)/)
			if (mainQueryMatch) {
				const mainParams = parseQueryString(mainQueryMatch?.[1] || '')
				Object.assign(params, mainParams)
			}

			// Парсим параметры из хеша
			if (hashMatch && hashMatch[2]) {
				const hashQueryString = hashMatch[2].slice(1) // Убираем "?"
				const hashParams = parseQueryString(hashQueryString)
				Object.assign(params, hashParams)
			}

			const baseUrl = url?.split('?')?.[0]?.split('#')[0] || ''

			return {
				baseUrl,
				hash,
				params,
				hasParams: Object.keys(params).length > 0,
			}
		} catch {
			return {
				baseUrl: url,
				hash: null,
				params: {},
				hasParams: false,
			}
		}
	}
}

