import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Lock, Mail, Zap } from "lucide-react";
import { useState } from "react";
import { loginUser } from "../../server/functions/auth";
import { colors, fontSize, fontWeight, radii, spacing } from "../../tokens.stylex";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

const styles = stylex.create({
	wrapper: {
		minHeight: "100vh",
		display: "flex",
	},
	brandingSide: {
		display: "none",
		"@media (min-width: 1024px)": {
			display: "flex",
			width: "50%",
			backgroundImage: `linear-gradient(145deg, ${colors.indigo500}, ${colors.blue600}, ${colors.purple500})`,
			padding: spacing["3xl"],
			alignItems: "center",
			justifyContent: "center",
			position: "relative",
			overflow: "hidden",
		},
	},
	brandingOverlay: {
		position: "absolute",
		inset: 0,
		backgroundImage:
			"url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDgpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')",
		opacity: 0.4,
	},
	brandingContent: {
		position: "relative",
		zIndex: 10,
		textAlign: "center",
		color: colors.white,
	},
	brandingLogo: {
		width: "5.5rem",
		height: "5.5rem",
		borderRadius: "1.25rem",
		backgroundColor: "rgba(255, 255, 255, 0.15)",
		backdropFilter: "blur(16px)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: "auto",
		marginRight: "auto",
		marginBottom: spacing["3xl"],
		boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
		border: "1px solid rgba(255, 255, 255, 0.18)",
	},
	brandingTitle: {
		fontSize: fontSize["4xl"],
		fontWeight: fontWeight.bold,
		marginBottom: spacing.md,
		color: colors.white,
		letterSpacing: "-0.025em",
	},
	brandingSubtitle: {
		fontSize: fontSize.lg,
		color: "rgba(255, 255, 255, 0.8)",
		maxWidth: "28rem",
		lineHeight: "1.6",
		fontWeight: 400,
	},
	formSide: {
		flex: 1,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing["3xl"],
		backgroundColor: "#0f172a", // Deep slate/obsidian
		backgroundImage:
			"radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)",
	},
	formContainer: {
		width: "100%",
		maxWidth: "28rem",
	},
	mobileLogo: {
		display: "flex",
		justifyContent: "center",
		marginBottom: spacing["3xl"],
		"@media (min-width: 1024px)": {
			display: "none",
		},
	},
	mobileLogoIcon: {
		width: "4.5rem",
		height: "4.5rem",
		borderRadius: "1.25rem",
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.purple500})`,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
	},
	card: {
		backgroundColor: "rgba(30, 41, 59, 0.7)",
		backdropFilter: "blur(20px) saturate(180%)",
		borderRadius: "2rem",
		boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
		padding: spacing["3xl"],
		border: "1px solid rgba(255, 255, 255, 0.1)",
	},
	heading: {
		fontSize: "2rem",
		fontWeight: 800,
		color: colors.white,
		marginBottom: spacing.xs,
		letterSpacing: "-0.025em",
	},
	subheading: {
		color: "#94a3b8",
		marginBottom: spacing["3xl"],
		fontSize: fontSize.base,
		fontWeight: 400,
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xl,
	},
	errorBox: {
		display: "flex",
		alignItems: "center",
		gap: spacing.md,
		padding: spacing.md,
		backgroundColor: "rgba(239, 68, 68, 0.15)",
		color: "#fca5a5",
		borderRadius: radii.md,
		fontSize: fontSize.sm,
		border: "1px solid rgba(239, 68, 68, 0.3)",
		fontWeight: 500,
	},
	errorIconShrink: {
		flexShrink: 0,
	},
	fieldGroup: {
		display: "flex",
		flexDirection: "column",
		gap: spacing.xl,
	},
	label: {
		display: "block",
		fontSize: "0.75rem",
		fontWeight: 600,
		color: "#cbd5e1",
		marginBottom: spacing.sm,
		textTransform: "uppercase",
		letterSpacing: "0.1em",
	},
	inputWrapper: {
		position: "relative",
	},
	inputIconWrapper: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		paddingLeft: spacing.lg,
		display: "flex",
		alignItems: "center",
		pointerEvents: "none",
	},
	inputIcon: {
		color: "#64748b",
		transition: "color 0.2s",
	},
	inputIconFocused: {
		color: colors.indigo400,
	},
	input: {
		display: "block",
		width: "100%",
		paddingLeft: "3.25rem",
		paddingRight: spacing.xl,
		paddingTop: "1rem",
		paddingBottom: "1rem",
		border: "1.5px solid rgba(255, 255, 255, 0.1)",
		borderRadius: "1rem",
		fontSize: fontSize.base,
		outline: "none",
		transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
		boxSizing: "border-box",
		backgroundColor: "rgba(15, 23, 42, 0.6)",
		color: colors.white,
		":focus": {
			borderColor: colors.indigo500,
			boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.2)",
			backgroundColor: "rgba(15, 23, 42, 0.8)",
		},
		"::placeholder": {
			color: "#475569",
		},
	},
	submitButton: {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.md,
		paddingTop: "1rem",
		paddingBottom: "1rem",
		paddingLeft: spacing["2xl"],
		paddingRight: spacing["2xl"],
		fontSize: fontSize.base,
		backgroundImage: `linear-gradient(135deg, ${colors.indigo500}, ${colors.purple500})`,
		color: colors.white,
		fontWeight: 700,
		borderRadius: "1rem",
		border: "none",
		cursor: "pointer",
		transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
		":hover": {
			boxShadow: "0 15px 30px -5px rgba(99, 102, 241, 0.6)",
			transform: "translateY(-2px)",
			backgroundImage: `linear-gradient(135deg, ${colors.indigo600}, ${colors.purple500})`,
		},
		":active": {
			transform: "translateY(0)",
		},
		":disabled": {
			opacity: 0.6,
			cursor: "not-allowed",
			transform: "none",
			boxShadow: "none",
		},
	},
	spinner: {
		width: "1.25rem",
		height: "1.25rem",
		border: "2.5px solid rgba(255, 255, 255, 0.3)",
		borderTopColor: colors.white,
		borderRadius: radii.full,
		animationName: stylex.keyframes({
			"0%": { transform: "rotate(0deg)" },
			"100%": { transform: "rotate(360deg)" },
		}),
		animationDuration: "0.6s",
		animationIterationCount: "infinite",
		animationTimingFunction: "linear",
	},
	footer: {
		marginTop: spacing["3xl"],
		textAlign: "center",
		paddingTop: spacing.xl,
		borderTop: "1px solid rgba(255, 255, 255, 0.05)",
	},
	footerText: {
		color: "#64748b",
		fontSize: fontSize.sm,
		fontWeight: 500,
	},
	signUpLink: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.25rem",
		color: colors.indigo400,
		fontWeight: 700,
		textDecoration: "none",
		paddingLeft: spacing.xs,
		transition: "all 0.2s",
		":hover": {
			color: colors.indigo500,
			transform: "translateX(2px)",
		},
	},
	iconWhite: {
		color: colors.white,
	},
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await loginUser({ data: { email, password } });
			navigate({ to: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div {...stylex.props(styles.wrapper)}>
			{/* Left side - Branding */}
			<div {...stylex.props(styles.brandingSide)}>
				<div {...stylex.props(styles.brandingOverlay)} />
				<div {...stylex.props(styles.brandingContent)}>
					<div {...stylex.props(styles.brandingLogo)}>
						<Zap size={48} {...stylex.props(styles.iconWhite)} />
					</div>
					<h1 {...stylex.props(styles.brandingTitle)}>Vaye</h1>
					<p {...stylex.props(styles.brandingSubtitle)}>
						The most professional social platform for meaningful connections.
					</p>
				</div>
			</div>

			{/* Right side - Form */}
			<div {...stylex.props(styles.formSide)}>
				<div {...stylex.props(styles.formContainer)}>
					{/* Mobile logo */}
					<div {...stylex.props(styles.mobileLogo)}>
						<div {...stylex.props(styles.mobileLogoIcon)}>
							<Zap size={32} {...stylex.props(styles.iconWhite)} />
						</div>
					</div>

					<div {...stylex.props(styles.card)}>
						<h2 {...stylex.props(styles.heading)}>Welcome back</h2>
						<p {...stylex.props(styles.subheading)}>Log in to your Vaye account</p>

						<form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
							{error && (
								<div {...stylex.props(styles.errorBox)}>
									<AlertCircle size={20} {...stylex.props(styles.errorIconShrink)} />
									{error}
								</div>
							)}

							<div {...stylex.props(styles.fieldGroup)}>
								<div>
									<label htmlFor="email" {...stylex.props(styles.label)}>
										Email address
									</label>
									<div {...stylex.props(styles.inputWrapper)}>
										<div {...stylex.props(styles.inputIconWrapper)}>
											<Mail size={20} {...stylex.props(styles.inputIcon)} />
										</div>
										<input
											id="email"
											name="email"
											type="email"
											autoComplete="email"
											required
											{...stylex.props(styles.input)}
											placeholder="you@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
										/>
									</div>
								</div>

								<div>
									<label htmlFor="password" {...stylex.props(styles.label)}>
										Password
									</label>
									<div {...stylex.props(styles.inputWrapper)}>
										<div {...stylex.props(styles.inputIconWrapper)}>
											<Lock size={20} {...stylex.props(styles.inputIcon)} />
										</div>
										<input
											id="password"
											name="password"
											type="password"
											autoComplete="current-password"
											required
											{...stylex.props(styles.input)}
											placeholder="••••••••"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
										/>
									</div>
								</div>
							</div>

							<button type="submit" disabled={loading} {...stylex.props(styles.submitButton)}>
								{loading ? (
									<>
										<div {...stylex.props(styles.spinner)} />
										Signing in...
									</>
								) : (
									<>
										Sign in
										<ArrowRight size={20} />
									</>
								)}
							</button>
						</form>

						<div {...stylex.props(styles.footer)}>
							<p {...stylex.props(styles.footerText)}>
								Don't have an account?{" "}
								<Link to="/auth/register" {...stylex.props(styles.signUpLink)}>
									Sign up
									<ArrowRight size={16} />
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
