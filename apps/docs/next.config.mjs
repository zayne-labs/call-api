import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/**
 * @type {import('next').NextConfig}
 */
const config = {
	devIndicators: {
		position: "bottom-right",
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	reactStrictMode: true,
	async rewrites() {
		return [
			{
				destination: "/llms.mdx/:path*",
				source: "/docs/:path*.mdx",
			},
		];
	},
	serverExternalPackages: ["twoslash", "typescript", "shiki"],
};

export default withMDX(config);
