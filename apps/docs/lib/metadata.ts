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
			images: "https://zayne-labs-callapi.netlify.app/og.png",
			siteName: "CallApi",
			title: override.title ?? undefined,
			url: baseURL.toString(),
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@zayne_el_kaiser",
			description: override.description ?? undefined,
			images: "https://zayne-labs-callapi.netlify.app/og.png",
			title: override.title ?? undefined,
			...override.twitter,
		},
	};
}
