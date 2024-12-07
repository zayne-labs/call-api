import "../tailwind.css";
import { RootProvider as FumaThemeProvider } from "fumadocs-ui/provider";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
	subsets: ["latin"],
});

function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning={true}>
			<body className="flex flex-col min-h-screen">
				<FumaThemeProvider>{children}</FumaThemeProvider>
			</body>
		</html>
	);
}

export default RootLayout;
