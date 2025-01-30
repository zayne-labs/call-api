import { createFetchClient, definePlugin } from "@zayne-labs/callapi";
import { z } from "zod";

const newOptionSchema = z.object({
	onUpload: z.function().args(
		z.object({
			loaded: z.number(),
			total: z.number(),
		})
	),
});

const plugin = definePlugin({
	createExtraOptions: (...params) => newOptionSchema.parse(params),

	hooks: {
		onRequest: () => console.info("PLUGIN-OnRequest"),
	},

	id: "1",

	init: ({ request }) => ({
		request: {
			...request,
			headers: {
				...request.headers,
				Access: "true",
				Authorization: request.headers?.["X-Environment"],
			},
		},
	}),

	name: "plugin",
});

const callApi = createFetchClient({
	dedupeStrategy: "cancel",
	onRequest: () => console.info("OnBaseRequest"),
	onUpload: (progress) => progress,
	plugins: [plugin],
});

// const foo1 = void callApi("https://dummyjson.com/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo2 = void callApi("https://dummyjson.com/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo3 = void callApi("https://dummyjson.com/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo4 = void callApi("https://dummyjson.com/products/:id", {
// 	method: "GET",
// 	params: [1],
// });

const [foo1, foo2, foo3, foo4] = await Promise.all([
	callApi("https://dummyjson.com/products/:id", {
		method: "GET",
		params: [1],
	}),
	callApi("https://dummyjson.com/products/:id", {
		method: "GET",
		params: [1],
	}),
	callApi("https://dummyjson.com/products/:id", {
		method: "GET",
		params: [1],
	}),
	callApi("https://dummyjson.com/products/:id", {
		method: "GET",
		onRequest: () => console.info("OnRequest"),
		params: [1320],
	}),
]);

console.info(foo1, foo2, foo3, foo4);
