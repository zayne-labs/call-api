import { docs, meta } from "@/.source";
import { icons as lucideIcons } from "@iconify-json/lucide";
import { Icon } from "@iconify/react";
import { getIconData } from "@iconify/utils";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { createElement } from "react";

export const source = loader({
	baseUrl: "/docs",
	icon: (iconName) => {
		if (!iconName) return;

		const iconData = getIconData(lucideIcons, iconName);

		return createElement(Icon, { icon: iconData ?? iconName });
	},
	source: createMDXSource(docs, meta),
});
