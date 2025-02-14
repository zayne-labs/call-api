import { baseUrl } from "@/lib/metadata";
import { source } from "@/lib/source";
import type { MetadataRoute } from "next";

export const revalidate = false;

const getURL = (path: string): string => new URL(path, baseUrl).toString();

export default function sitemap(): MetadataRoute.Sitemap {
	const pageConfigs = source.getPages().map((page) => {
		const { lastModified } = page.data;

		return {
			changeFrequency: "weekly",
			lastModified: lastModified ? new Date(lastModified) : undefined,
			priority: 0.5,
			url: getURL(page.url),
		} as MetadataRoute.Sitemap[number];
	});

	return [
		{
			changeFrequency: "monthly",
			priority: 1,
			url: getURL("/"),
		},
		{
			changeFrequency: "monthly",
			priority: 0.8,
			url: getURL("/docs"),
		},
		...pageConfigs,
	];
}
