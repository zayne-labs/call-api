import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

/* eslint-disable perfectionist/sort-objects */

export const baseOptions: BaseLayoutProps = {
	nav: {
		title: <span className="font-medium [header_&]:text-[15px]">CallApi</span>,
		transparentMode: "top",
	},
	links: [
		{
			text: "Documentation",
			url: "/docs",
			active: "nested-url",
		},
	],
};

// docs layout configuration
// export const docsOptions: DocsLayoutProps = {
// 	...baseOptions,
// 	tree: pageTree,
// 	nav: {
// 		title: "Better Fetch",
// 	},
// 	sidebar: {
// 		collapsible: false,
// 		footer: (
// 			<Link href="https://github.com/bekacru/better-fetch" target="_blank">
// 				<GitHubLogoIcon width={16} height={16} />
// 			</Link>
// 		),
// 		defaultOpenLevel: 1,
// 	},
// };
