import { baseUrl, createMetadata } from "@/lib/metadata";
import { RootProvider as FumaThemeProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "../tailwind.css";

// eslint-disable-next-line react-refresh/only-export-components -- Not relevant in Next.js
export const metadata = createMetadata({
	colorScheme: "dark light",
	description: "A lightweight and type-safe HTTP client for TypeScript and JavaScript",
	keywords: ["http", "fetch", "typescript", "javascript", "api", "client", "http-client"],
	metadataBase: baseUrl,
	robots: {
		follow: true,
		googleBot: {
			follow: true,
			index: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
		index: true,
	},
	title: {
		default: "CallApi",
		template: "%s | CallApi",
	},
	viewport: {
		initialScale: 1,
		width: "device-width",
	},
});

function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className={`${GeistSans.variable} ${GeistMono.variable}`}
			suppressHydrationWarning={true}
		>
			<head>
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="theme-color" content="#ffffff" />
			</head>
			<body>
				<FumaThemeProvider>{children}</FumaThemeProvider>
			</body>
		</html>
	);
}

export default RootLayout;
