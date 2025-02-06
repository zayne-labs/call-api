import { createMetadataImage } from "fumadocs-core/server";
import { source } from "../app/source";

export const metadataImage = createMetadataImage({
	imageRoute: "/docs-og",
	source,
});
