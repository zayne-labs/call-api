import { BgPattern } from "@/components/icons";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { docsOptions } from "../layout.config";
import "fumadocs-twoslash/twoslash.css";

function Layout({ children }: { children: React.ReactNode }) {
	return (
		<DocsLayout {...docsOptions}>
			<span
				className="absolute inset-0 z-[-1] h-[64rem] max-h-screen overflow-hidden"
				style={{
					backgroundImage:
						"radial-gradient(49.63% 57.02% at 58.99% -7.2%, hsl(var(--fd-primary)/0.1) 39.4%, transparent 100%)",
				}}
			>
				<BgPattern />
			</span>

			{children}
		</DocsLayout>
	);
}

export default Layout;
