import { BgPattern } from "@/components/icons";
import { DocsLayout as FumaDocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { docsOptions } from "../layout.config";

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
