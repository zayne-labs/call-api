import { docs, meta } from "@/.source";
// import { IconBox } from "@/components/common";
// import { icons as lucideIcons } from "@iconify-json/lucide";
// import { Icon } from "@iconify/react";
// import { getIconData } from "@iconify/utils";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { icons as lucideIcons } from "lucide-react";
import { createElement } from "react";

export const source = loader({
	baseUrl: "/docs",
	icon: (iconName) => {
		if (!iconName) return;

		// const iconData = getIconData(lucideIcons, iconName);

		// return createElement(IconBox, { icon: iconData });

		if (!(iconName in lucideIcons)) return;

		return createElement(lucideIcons[iconName as keyof typeof lucideIcons]);
	},
	source: createMDXSource(docs, meta),
});
