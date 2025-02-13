import {
	type CallApiSchemas,
	type InterceptorsOrInterceptorArray,
	type PluginInitContext,
	type SuccessContext,
	createFetchClient,
	definePlugin,
} from "@zayne-labs/callapi";
import { z } from "zod";

const newOptionSchema1 = z.object({
	onUpload: z.function().args(
		z.object({
			loaded: z.number(),
			total: z.number(),
		})
	),
});

const newOptionSchema2 = z.object({
	onUploadSuccess: z.function().args(
		z.object({
			load: z.number(),
			tots: z.number(),
		})
	),
});

const plugin1 = definePlugin({
	createExtraOptions: () => newOptionSchema1,

	hooks: {
		onRequest: () => console.info("PLUGIN1-OnRequest"),
	},

	id: "1",

	name: "plugin",
});

const plugin2 = definePlugin(() => ({
	createExtraOptions: () => newOptionSchema2,

	hooks: {
		onRequest: () => console.info("PLUGIN2-OnRequest"),
		onSuccess: (ctx: SuccessContext<{ foo: string }>) => console.info({ data: ctx.data }),
	} satisfies InterceptorsOrInterceptorArray<never, never, z.infer<typeof newOptionSchema2>>,

	id: "2",

	init: ({ options, request }: PluginInitContext<z.infer<typeof newOptionSchema2>>) => {
		options.onUploadSuccess?.({ load: 0, tots: 0 });

		return {
			request: {
				...request,
				headers: {
					...request.headers,
					Authorization: request.headers?.["X-Environment"],
				},
			},
		};
	},

	name: "plugin",
}));

const baseSchemas = {
	// body: z.object({
	// 	foo: z.number(),
	// }),
	// data: z.object({
	// 	foo: z.number(),
	// }),
	initURL: z.literal("https://dummyjson.com/products/:id"),
	method: z.enum(["GET"]),
	// errorData: z.object({
	// 	message: z.string(),
	// }),
	// headers: z.object({
	// 	"X-Environment": z.string(),
	// }),
	// query: z.object({
	// 	id: z.string(),
	// }),
} satisfies CallApiSchemas;

const callApi = createFetchClient({
	baseURL: "https://dummyjson.com",
	dedupeStrategy: "cancel",
	onRequest: () => console.info("OnBaseRequest"),
	onUpload: (progress) => console.info({ progress }),
	onUploadSuccess: (progress) => console.info({ progress }),
	plugins: [plugin1, plugin2()],
	schemas: baseSchemas,
});

const [foo1, foo2, foo3, foo4] = await Promise.all([
	callApi("https://dummyjson.com/products/:id", {
		method: "GET",
		params: { id: 1 },
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
