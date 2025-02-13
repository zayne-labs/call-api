import { baseUrl } from "@/lib/metadata";
import type { MetadataRoute } from "next";
import { source } from "./source";

export default function sitemap(): MetadataRoute.Sitemap {
	const siteUrl = baseUrl.toString();

	// Get all doc pages
	const pages = source.getPages();

	const docPages = pages.map((page) => ({
		changeFrequency: "weekly" as const,
		lastModified: new Date(),
		priority: 0.7,
		url: `${siteUrl}/docs/${page.slugs.join("/")}`,
	}));

	// Base pages with higher priority
	const basePages = [
		{
			changeFrequency: "monthly" as const,
			lastModified: new Date(),
			priority: 1,
			url: siteUrl,
		},
		{
			changeFrequency: "weekly" as const,
			lastModified: new Date(),
			priority: 0.8,
			url: `${siteUrl}/docs`,
		},
	];

	return [...basePages, ...docPages];
}
