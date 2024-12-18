import { RootProvider as FumaThemeProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import "../tailwind.css";

function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${GeistSans.variable} ${GeistMono.variable}`}
			suppressHydrationWarning={true}
		>
			<body className="flex min-h-screen flex-col">
				<FumaThemeProvider>{children}</FumaThemeProvider>
			</body>
		</html>
	);
}

export default RootLayout;
