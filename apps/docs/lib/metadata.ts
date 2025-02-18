import type { Metadata } from "next";

export const baseURL = new URL(
	process.env.NODE_ENV === "development"
		? "http://localhost:3000"
		: "https://zayne-labs-callapi.netlify.app"
);

export function createMetadata(override: Metadata = {}): Metadata {
	return {
		...override,
		openGraph: {
			description: override.description ?? undefined,
			images: [
				{
					alt: "CallApi - The Ultimate API Testing Tool",
					height: 630,
					type: "image/png",
					url: "https://zayne-labs-callapi.netlify.app/og.png",
					width: 1200,
				},
			],
			siteName: "CallApi",
			title: override.title ?? undefined,
			type: "website",
			url: baseURL.toString(),
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@zayne_el_kaiser",
			description: override.description ?? undefined,
			images: [
				{
					alt: "CallApi - The Ultimate API Testing Tool",
					height: 630,
					url: "https://zayne-labs-callapi.netlify.app/og.png",
					width: 1200,
				},
			],
			title: override.title ?? undefined,
			...override.twitter,
		},
	};
}
