import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
	return {
		rules: {
			allow: "/",
			userAgent: "*",
		},
	};
};

export default robots;
