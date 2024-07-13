import { useRouter } from "next/router";
import { type DocsThemeConfig, useConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
	logo: (
		<div className="flex items-center gap-4">
			<p className="text-lg font-bold text-primary md:text-xl ">CallApi</p>
		</div>
	),
	project: {
		link: "https://github.com/zayne-labs/callapi",
	},
	head: () => {
		const { asPath, defaultLocale, locale, pathname } = useRouter();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { frontMatter } = useConfig();
		// eslint-disable-next-line sonarjs/no-nested-template-literals
		const url = `https://zayne-callapi.netlify.app${defaultLocale === locale ? asPath : `/${locale}${asPath}`}`;

		return (
			<>
				<title className="font-bold">
					{pathname === "/"
						? "CallApi"
						: `${
								pathname.replaceAll("/", "").charAt(0).toUpperCase() +
								pathname.replaceAll("/", "").slice(1)
							} - CallApi`}
				</title>
				<meta name="description" content="CallApi Docs - Documrentation for CallApi" />
				<meta property="og:url" content={url} />
				{/* eslint-disable @typescript-eslint/no-unsafe-member-access */}
				{/* eslint-disable @typescript-eslint/no-unsafe-assignment */}
				<meta property="og:title" content={frontMatter.title || "CallApi"} />
				<meta property="og:description" content={frontMatter.description || "CallApi docs"} />
			</>
		);
	},
	docsRepositoryBase: "https://github.com/zayne-labs/callapi",
	footer: {
		text: "CallApi docs",
		component: () => {
			return <></>;
		},
	},
};

export default config;
