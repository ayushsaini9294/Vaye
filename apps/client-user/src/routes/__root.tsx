import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { Header } from "../components/layout/Header";
import { MobileNav } from "../components/layout/MobileNav";
import { KeyboardShortcutsHelp } from "../components/shared/KeyboardShortcutsHelp";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "color-scheme", content: "light dark" },
			{ title: "Vaye - Social Feed" },
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
			{ rel: "stylesheet", href: appCss },
			{ rel: "stylesheet", href: "/virtual:stylex.css" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
				<style>{`
					@media (max-width: 767px) {
						body { padding-bottom: 4rem; }
					}
				`}</style>
			</head>
			<body>
				<Header />
				{children}
				<MobileNav />
				<KeyboardShortcutsHelp />
				<Scripts />
			</body>
		</html>
	);
}
