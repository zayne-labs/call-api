import { docs, meta } from "@/.source";
import { IconBox } from "@/components/common";
import { icons as lucideIcons } from "@iconify-json/lucide";
import { getIconData } from "@iconify/utils";
import { assert } from "@zayne-labs/toolkit/type-helpers";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { createElement } from "react";

export const source = loader({
	baseUrl: "/docs",
	icon: (iconName) => {
		if (!iconName) return;

		const iconData = getIconData(lucideIcons, iconName);

		assert(iconData, `Icon "${iconName}" is missing`);

		return createElement(IconBox, { icon: iconData });
	},
	source: createMDXSource(docs, meta),
});
