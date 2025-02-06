import { source } from "@/app/source";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound } from "next/navigation";


export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
	// eslint-disable-next-line react/prefer-destructuring-assignment -- Ignore this
	const params = await props.params;

	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	const MDX = page.data.body;

	return (
		<DocsPage
			toc={page.data.toc}
			tableOfContent={{
				single: false,
				style: "clerk",
			}}
			full={page.data.full}
		>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={{
						...defaultMdxComponents,
						AutoTypeTable,
						Popup,
						PopupContent,
						PopupTrigger,
						Tab,
						Tabs,
					}}
				/>
			</DocsBody>
		</DocsPage>
	);
}

/* eslint-disable react-refresh/only-export-components -- This doesn't apply to Next.js */
export function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
	const params = await props.params;

	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	return {
		description: page.data.description,
		title: page.data.title,
	};
}
/* eslint-enable react-refresh/only-export-components -- This doesn't apply to Next.js */
