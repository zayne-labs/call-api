import type { AppProps } from "next/app";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<Component {...pageProps} />
			<Analytics />
		</>
	);
}
