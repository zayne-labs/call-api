// eslint-disable-next-line import/extensions
import { baseOptions } from "@/app/layout.config";
import { BgPattern } from "@/components/icons";
import { source } from "@/lib/source";
import { DocsLayout as FumaDocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<FumaDocsLayout tree={source.pageTree} {...baseOptions}>
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
