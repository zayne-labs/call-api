import type { Metadata } from "next";

export const baseUrl = new URL(
	process.env.NODE_ENV === "development"
		? "http://localhost:3000"
		: `https://zayne-labs-callapi.netlify.app`
);

export function createMetadata(override: Metadata = {}): Metadata {
	return {
		...override,
		openGraph: {
			description: override.description ?? undefined,
			images: "/banner.png",
			siteName: "CallApi",
			title: override.title ?? undefined,
			url: baseUrl.toString(),
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@zayne_el_kaiser",
			description: override.description ?? undefined,
			images: "/banner.png",
			title: override.title ?? undefined,
			...override.twitter,
		},
	};
}
