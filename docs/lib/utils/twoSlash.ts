import {
	type TransformerTwoslashIndexOptions,
	transformerTwoslash as originalTransformer,
} from "@shikijs/twoslash";
import type { Element, ElementContent } from "hast";
import type { Code } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { defaultHandlers, toHast } from "mdast-util-to-hast";
import type { ShikiTransformer, ShikiTransformerContextCommon } from "shiki";

/**
 * @copied from fumadocs-twoslash package, but with modifications to make it work with @annotate tags.
 * I achieved this by removing the twoSlashOptions completely,
 *
 * @see https://github.com/fuma-nama/fumadocs/blob/dev/packages/twoslash/src/index.ts
 */

export function transformerTwoslash(options?: TransformerTwoslashIndexOptions): ShikiTransformer {
	const ignoreClass = "nd-copy-ignore";

	return originalTransformer({
		explicitTrigger: true,
		...options,
		rendererRich: {
			classExtra: ignoreClass,
			hast: {
				hoverCompose: ({ popup, token }) => [
					popup,
					{
						children: [
							{
								children: [token],
								properties: {
									class: "twoslash-hover",
								},
								tagName: "span",
								type: "element",
							},
						],
						properties: {
							asChild: true,
						},
						tagName: "PopupTrigger",
						type: "element",
					},
				],
				hoverPopup: {
					tagName: "PopupContent",
				},
				hoverToken: {
					tagName: "Popup",
				},
				nodesHighlight: {
					class: "highlighted-word twoslash-highlighted",
				},
				popupDocs: {
					class: "prose twoslash-popup-docs",
				},
				popupDocsTags: {
					class: "prose twoslash-popup-docs twoslash-popup-docs-tags",
				},
				popupTypes: {
					children: (v) => {
						if (v.length === 1 && v[0]?.type === "element" && v[0].tagName === "pre") return v;

						return [
							{
								children: v,
								properties: {
									class: "twoslash-popup-code",
								},
								tagName: "code",
								type: "element",
							},
						];
					},
					class: "shiki prose-no-margin",
					tagName: "div",
				},
				...options?.rendererRich?.hast,
			},
			renderMarkdown,
			renderMarkdownInline,
			...options?.rendererRich,
		},
		// == twoslashOptions causes errors when using @annotate tags and co, so I removed it
		// twoslashOptions: {
		// 	...options?.twoslashOptions,
		// 	// compilerOptions: {
		// 	// 	// moduleResolution: undefined,
		// 	// 	...options?.twoslashOptions?.compilerOptions,
		// 	// },
		// },
	});
}

function renderMarkdown(this: ShikiTransformerContextCommon, md: string): ElementContent[] {
	const mdast = fromMarkdown(
		md.replaceAll(/{@link (?<link>[^}]*)}/g, "$1"), // replace jsdoc links
		{ mdastExtensions: [gfmFromMarkdown()] }
	);

	return (
		toHast(mdast, {
			handlers: {
				code: (state, node: Code) => {
					if (node.lang) {
						return this.codeToHast(node.value, {
							...this.options,
							lang: node.lang,
							meta: {
								__raw: node.meta ?? undefined,
							},
							transformers: [],
						}).children[0] as Element;
					}

					return defaultHandlers.code(state, node);
				},
			},
		}) as Element
	).children;
}

function renderMarkdownInline(
	this: ShikiTransformerContextCommon,
	md: string,
	context?: string
): ElementContent[] {
	const text = context === "tag:param" ? md.replace(/^(?<link>[\w$-]+)/, "`$1` ") : md;

	const children = renderMarkdown.call(this, text);
	if (children.length === 1 && children[0]?.type === "element" && children[0]?.tagName === "p") {
		return children[0].children;
	}
	return children;
}
