import jwt from "jsonwebtoken";

// JWT secret — must match the same value in both apps.
// In production set GRPC_JWT_SECRET env var to something secure.
const JWT_SECRET = process.env.GRPC_JWT_SECRET || "vaye-grpc-jwt-secret-key-at-least-32-chars";

export interface AuthContext {
	userId: string;
	username: string;
	role: "user" | "admin" | "moderator";
}

/** Sign a new session JWT (7 day expiry) */
export function createSessionToken(context: AuthContext): string {
	return jwt.sign(
		{ userId: context.userId, username: context.username, role: context.role },
		JWT_SECRET,
		{ expiresIn: 7 * 24 * 60 * 60 },
	);
}

/** Verify a JWT and return the payload — throws if invalid */
export function validateSessionToken(token: string): AuthContext {
	const decoded = jwt.verify(token, JWT_SECRET) as AuthContext;
	return { userId: decoded.userId, username: decoded.username, role: decoded.role };
}
