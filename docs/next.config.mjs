import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/**
 * @type {import('next').NextConfig}
 */
const config = {
	devIndicators: {
		appIsrStatus: false,
	},
	experimental: {
		reactOwnerStack: true,
	},
	reactStrictMode: true,
};

export default withMDX(config);
