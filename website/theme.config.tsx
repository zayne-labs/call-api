import React from "react";
import { DocsThemeConfig, useConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";

const config: DocsThemeConfig = {
	logo: (
		<div className="flex items-center gap-4">
			<p className="text-lg font-bold text-primary md:text-xl ">CallApi</p>
		</div>
	),
	project: {
		link: "https://github.com/Ryan-Zayne/CallApi",
	},
	head: () => {
		const { asPath, defaultLocale, locale, pathname } = useRouter();
		const { frontMatter } = useConfig();
		const url =
			"https://CallApi.vercel.app" + (defaultLocale === locale ? asPath : `/${locale}${asPath}`);

		return (
			<>
				<title className="font-bold">{`${
					pathname == "/"
						? "CallApi"
						: pathname.replaceAll("/", "").charAt(0).toUpperCase() +
							pathname.replaceAll("/", "").slice(1) +
							" - CallApi"
				}`}</title>
				<meta name="description" content="CallApi Docs - Documentation for CallApi" />
				<meta property="og:url" content={url} />
				<meta property="og:title" content={frontMatter.title || "CallApi"} />
				<meta property="og:description" content={frontMatter.description || "CallApi docs"} />
			</>
		);
	},
	docsRepositoryBase: "https://github.com/Ryan-Zayne/CallApi",
	footer: {
		text: "CallApi docs",
		component: () => {
			return <></>;
		},
	},
};

export default config;
