import * as Twoslash from "fumadocs-twoslash/ui";
import * as Tabs from "fumadocs-ui/components/tabs";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export const getMDXComponents = (components?: MDXComponents): MDXComponents => {
	return {
		...defaultComponents,
		...Twoslash,
		...Tabs,
		...components,
	};
};
