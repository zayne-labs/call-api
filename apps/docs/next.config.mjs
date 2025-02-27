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
};

export default withMDX(config);
