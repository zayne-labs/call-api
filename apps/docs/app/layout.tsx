/* eslint-disable react-refresh/only-export-components -- Not relevant in Next.js */
import { baseURL, createMetadata } from "@/lib/metadata";
import { RootProvider as FumaThemeProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "../tailwind.css";

export const metadata = createMetadata({
	description: "A lightweight, type-safe Fetch API wrapper with dozens of convenience features.",
	keywords: ["fetch", "type-safe", "interceptors", "callapi", "dedupe"],
	metadataBase: baseURL,
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
				<link rel="icon" href="/favicon/favicon.ico" sizes="any" />
				<meta name="google-site-verification" content="LH-8qDRpnWdy6YKOKmi18ZQ4gW9EgoeDkarkyQc8Tl8" />
			</head>
			<body>
				<FumaThemeProvider>{children}</FumaThemeProvider>
			</body>
		</html>
	);
}

export default RootLayout;
