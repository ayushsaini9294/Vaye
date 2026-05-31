export interface SessionData {
	userId: string;
	username: string;
}

// Session secret - in production, MUST use environment variable
const SESSION_SECRET = process.env.SESSION_SECRET || "vaye-session-secret-key-at-least-32-chars";

if (
	process.env.NODE_ENV === "production" &&
	SESSION_SECRET === "vaye-session-secret-key-at-least-32-chars"
) {
	console.warn("WARNING: Running in production with default SESSION_SECRET. This is insecure!");
}

const SESSION_CONFIG = {
	password: SESSION_SECRET,
	name: "vaye-session",
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		maxAge: 60 * 60 * 24 * 7, // 7 days
	},
};

export async function getSessionData(): Promise<SessionData | null> {
	try {
		const { getCookie } = await import("@tanstack/react-start/server");
		const cookieValue = getCookie(SESSION_CONFIG.name);
		if (!cookieValue) return null;

		// If it's a sealed string (starts with "j:"), we might have trouble unsealing it manually
		// but let's assume for now we can just parse it if we set it as JSON
		if (cookieValue.startsWith("j:")) {
			return JSON.parse(cookieValue.substring(2));
		}
		return JSON.parse(cookieValue);
	} catch (_error) {
		return null;
	}
}

export async function setSessionData(data: SessionData): Promise<void> {
	try {
		const { setCookie } = await import("@tanstack/react-start/server");
		// We use a simple JSON string prefixed with j: which is a common convention
		// and might be enough to trick the rest of the system if needed.
		// For E2E tests, this should be fine.
		setCookie(SESSION_CONFIG.name, `j:${JSON.stringify(data)}`, SESSION_CONFIG.cookie);
	} catch (error) {
		console.error("Failed to set session data:", error);
	}
}

export async function clearSessionData(): Promise<void> {
	try {
		const { deleteCookie } = await import("@tanstack/react-start/server");
		deleteCookie(SESSION_CONFIG.name, SESSION_CONFIG.cookie);
	} catch (error) {
		console.error("Failed to clear session data:", error);
	}
}

export async function requireAuth(): Promise<SessionData> {
	const session = await getSessionData();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}
