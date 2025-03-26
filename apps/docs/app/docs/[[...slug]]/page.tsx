import { baseURL } from "@/lib/metadata";
import { source } from "@/lib/source";
import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
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

	const path = `apps/docs/content/docs/${page.file.path}`;

	const MDX = page.data.body;

	return (
		<DocsPage
			toc={page.data.toc}
			tableOfContent={{
				single: false,
				style: "clerk",
			}}
			editOnGithub={{
				owner: "zayne-labs",
				path,
				repo: "callapi",
				sha: "main",
			}}
			full={page.data.full}
		>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody>
				<MDX
					components={{
						...defaultMdxComponents,
						Popup,
						PopupContent,
						PopupTrigger,
						Tab,
						Tabs,
						TypeTable,
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

const absoluteUrl = (path: string) => `${baseURL}${path}`;

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
	const { slug } = await params;
	const page = source.getPage(slug);

	if (page == null) notFound();

	const url = new URL(`${baseURL}/api/og`);
	const { description, title } = page.data;
	const pageSlug = page.file.path;

	url.searchParams.set("type", "Documentation");
	url.searchParams.set("mode", "dark");
	url.searchParams.set("heading", title);

	return {
		description,
		openGraph: {
			description,
			images: [
				{
					alt: title,
					height: 630,
					url: url.toString(),
					width: 1200,
				},
			],
			title,
			type: "website",
			url: absoluteUrl(`docs/${pageSlug}`),
		},
		title,
		twitter: {
			card: "summary_large_image",
			description,
			images: [url.toString()],
			title,
		},
	};
}

/* eslint-enable react-refresh/only-export-components -- This doesn't apply to Next.js */
