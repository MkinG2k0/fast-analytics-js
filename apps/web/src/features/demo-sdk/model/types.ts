export interface DemoEvent {
	id: string;
	type: "error" | "warning" | "info" | "debug" | "page-visit" | "session";
	message: string;
	timestamp: Date;
}

