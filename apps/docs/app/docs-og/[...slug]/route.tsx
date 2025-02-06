import { metadataImage } from "@/lib/metadata";
import { generateOGImage } from "fumadocs-ui/og";

export const GET = metadataImage.createAPI((page) => {
	return generateOGImage({
		description: page.data.description,
		site: "CallApi",
		title: page.data.title,
	});
});

/* eslint-disable react-refresh/only-export-components -- This doesn't apply to Next.js */

export function generateStaticParams() {
	return metadataImage.generateParams();
}

/* eslint-enable react-refresh/only-export-components -- This doesn't apply to Next.js */
