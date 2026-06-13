import { createHash } from "node:crypto";

/** Generate a unique ID */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Hash a password (SHA-256 with salt) */
export async function hashPassword(password: string): Promise<string> {
	const hash = createHash("sha256");
	hash.update(`${password}salt`);
	return hash.digest("hex");
}

/** Verify a password against a hash */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	const hash = await hashPassword(password);
	return hash === hashedPassword;
}
