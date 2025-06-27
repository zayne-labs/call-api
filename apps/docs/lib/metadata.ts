import type { Metadata } from "next";

export const baseURL =
	process.env.NODE_ENV === "development" ?
		"http://localhost:3000"
	:	"https://zayne-labs-callapi.netlify.app";

export function createMetadata(overrides?: Metadata): Metadata {
	return {
		...overrides,

		openGraph: {
			description: overrides?.description ?? undefined,
			images: [
				{
					alt: "CallApi - The Ultimate Fetch API Wrapper",
					height: 630,
					type: "image/png",
					url: "/og.png",
					width: 1200,
				},
			],
			siteName: "CallApi",
			title: overrides?.title ?? undefined,
			type: "website",
			url: baseURL,

			...overrides?.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@zayne_el_kaiser",
			description: overrides?.description ?? undefined,
			images: [
				{
					alt: "CallApi - The Ultimate Fetch API Wrapper",
					height: 630,
					url: "/og.png",
					width: 1200,
				},
			],
			title: overrides?.title ?? undefined,

			...overrides?.twitter,
		},
	};
}
