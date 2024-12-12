// eslint-disable-next-line import/extensions
import { baseOptions } from "@/app/layout.config";
import { source } from "@/app/source";
import { BgPattern, GitHubIcon } from "@/components/icons";
import { type DocsLayoutProps, DocsLayout as FumaDocsLayout } from "fumadocs-ui/layouts/docs";
import Link from "next/link";
import type { ReactNode } from "react";

const docsOptions: DocsLayoutProps = {
	...baseOptions,
	sidebar: {
		className: "flex-row",
		collapsible: false,
		defaultOpenLevel: 1,
		footer: (
			<Link href="https://github.com/zayne-labs/callapi" target="_blank">
				<GitHubIcon width={16} height={16} />
			</Link>
		),
	},
	tree: source.pageTree,
};

function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<FumaDocsLayout {...docsOptions}>
			<span
				className="absolute inset-0 z-[-1] h-[64rem] max-h-screen overflow-hidden"
				style={{
					backgroundImage:
						"radial-gradient(49.63% 57.02% at 58.99% -7.2%, hsl(var(--primary)/0.1) 39.4%, transparent 100%)",
				}}
			>
				<BgPattern />
			</span>

			{children}
		</FumaDocsLayout>
	);
}

export default DocsLayout;
