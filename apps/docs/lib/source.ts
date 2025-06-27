import { type InferMetaType, type InferPageType, loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { icons as lucideIcons } from "lucide-react";
import { createElement } from "react";
import { docs, meta } from "@/.source";

export const source = loader({
	baseUrl: "/docs",
	icon: (iconName) => {
		if (!iconName) return;

		if (!(iconName in lucideIcons)) return;

		return createElement(lucideIcons[iconName as keyof typeof lucideIcons]);
	},
	source: createMDXSource(docs, meta),
});

export type Page = InferPageType<typeof source>;
export type Meta = InferMetaType<typeof source>;
