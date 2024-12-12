import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import Logo from "public/logo.png";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

/* eslint-disable perfectionist/sort-objects */

export const logo = <Image alt="CallApi" src={Logo} width={18} height={18} aria-label="Fumadocs" />;

export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<>
				{logo}
				<span className="font-medium [header_&]:text-[15px]">CallApi</span>
			</>
		),
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
