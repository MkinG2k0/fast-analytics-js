export interface LevelColorConfig {
	color: string;
	bg: string;
}

export const levelColors: Record<string, LevelColorConfig> = {
	error: {color: '#ef4444', bg: '#fee2e2'},
	warn: {color: '#f59e0b', bg: '#fef3c7'},
	info: {color: '#3b82f6', bg: '#dbeafe'},
	debug: {color: '#6b7280', bg: '#f3f4f6'},
}

export function getLevelColorConfig(level: string): LevelColorConfig {
	return (levelColors[level] ?? levelColors.debug) as LevelColorConfig
}

