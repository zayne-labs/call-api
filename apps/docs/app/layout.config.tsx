import { source } from "@/lib/source";
import { assertDefined } from "@zayne-labs/toolkit/type-helpers";
import type { DocsLayoutProps, LinkItemType } from "fumadocs-ui/layouts/docs";
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

/* eslint-disable perfectionist/sort-objects -- Ignore sort here */
const linkItems = [
	{
		text: "Documentation",
		url: "/docs/v1",
		active: "nested-url",
	},
	{
		type: "icon",
		url: "https://github.com/zayne-labs/callapi",
		text: "Github",
		icon: (
			<svg role="img" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
			</svg>
		),
		external: true,
	},
] satisfies LinkItemType[];
/* eslint-enable perfectionist/sort-objects -- Ignore sort here */

export const baseOptions: BaseLayoutProps = {
	links: linkItems,
};

export const docsOptions: DocsLayoutProps = {
	...baseOptions,

	links: [assertDefined(linkItems.at(-1))],

	nav: {
		title: (
			<>
				<Image
					alt="CallApi"
					src={Logo as unknown as string}
					width={18}
					height={18}
					className="rounded-[5px]"
					aria-label="CallApi"
				/>
				<p className="font-medium [header_&]:text-[15px]">CallApi</p>
			</>
		),
		transparentMode: "top",
	},

	sidebar: {
		collapsible: false,
		defaultOpenLevel: 0,

		tabs: {
			transform: (option, node) => {
				const meta = source.getNodeMeta(node);

				if (!meta) {
					return option;
				}

				return {
					...option,
					icon: (
						<div
							className="from-fd-background/80 text-fd-primary rounded-md border bg-gradient-to-t
								p-1 shadow-md [&_svg]:size-5"
						>
							{node.icon}
						</div>
					),
				};
			},
		},
	},
	tree: source.pageTree,
};
