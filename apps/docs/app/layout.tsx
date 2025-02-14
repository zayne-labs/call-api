/* eslint-disable react-refresh/only-export-components -- Not relevant in Next.js */
import { baseUrl, createMetadata } from "@/lib/metadata";
import { RootProvider as FumaThemeProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "../tailwind.css";

export const metadata = createMetadata({
	colorScheme: "dark light",
	description: "A lightweight, type-safe Fetch API wrapper with dozens of convenience features.",
	keywords: ["fetch", "type-safe", "api", "interceptors", "dedupe", "http-client"],
	metadataBase: baseUrl,
	title: {
		default: "CallApi",
		template: "%s | CallApi",
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
				<meta name="google-site-verification" content="LH-8qDRpnWdy6YKOKmi18ZQ4gW9EgoeDkarkyQc8Tl8" />
				<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
				<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0A0A0A" />
			</head>
			<body>
				<FumaThemeProvider>{children}</FumaThemeProvider>
			</body>
		</html>
	);
}

export default RootLayout;
