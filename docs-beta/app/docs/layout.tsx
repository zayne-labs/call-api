// eslint-disable-next-line import/extensions
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";
import { DocsLayout as FumaDocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<FumaDocsLayout tree={source.pageTree} {...baseOptions}>
			{children}
		</FumaDocsLayout>
	);
}

export default DocsLayout;
