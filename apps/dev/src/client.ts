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
		onSuccess: (_ctx: SuccessContext<{ foo: string }>) => console.info("PLUGIN2-OnSuccess"),
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
	// initURL: z.literal("/products/:id"),
	// method: z.enum(["GET"]),
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

const callMainApi = createFetchClient({
	baseURL: "https://dummyjson.com",
	onRequest: () => console.info("OnBaseRequest"),
	onUpload: (progress) => console.info({ progress }),
	onUploadSuccess: (progress) => console.info({ progress }),
	plugins: [plugin1, plugin2()],
	schemas: baseSchemas,
});

// function wait(milliseconds: number) {
// 	return new Promise((resolve) => setTimeout(resolve, milliseconds));
// }

// const stream = new ReadableStream({
// 	async start(controller) {
// 		await wait(1000);
// 		controller.enqueue("This ");
// 		await wait(1000);
// 		controller.enqueue("is ");
// 		await wait(1000);
// 		controller.enqueue("a ");
// 		await wait(1000);
// 		controller.enqueue("slow ");
// 		await wait(1000);
// 		controller.enqueue("request.");
// 		controller.close();
// 	},
// }).pipeThrough(new TextEncoderStream());

const [foo1, foo2, foo3, foo4] = await Promise.all([
	callMainApi<"", false | undefined>("/products/:id", {
		method: "GET",
		params: [1],
	}),
	callMainApi<"", false | undefined>("/products/:id", {
		method: "GET",
		params: [1],
	}),
	callMainApi("/products/:id", {
		body: ["dev"],
		method: "POST",
		params: [1],
	}),
	callMainApi("https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits?per_page=50", {
		baseURL: "",
		// body: stream,
		// headers: {
		// 	"content-length": new Blob(["3", "4", "5", "7", "8", "9", "10"]).size.toString(),
		// },
		forceContentLengthCalc: true,
		method: "GET",
		onRequestStream: (ctx) => console.info("OnRequestStream", { event: ctx.event }),
		onResponseStream: (ctx) => console.info("OnResponseStream", { event: ctx.event }),
		params: [1],
		throwOnError: true,
	}),
]);

console.info(foo1, foo2, foo3, foo4);

// const foo1 = void callApi("/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo2 = void callApi("/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo3 = void callApi("/products/:id", {
// 	method: "GET",
// 	params: [1],
// });
// const foo4 = void callApi("/products/:id", {
// 	method: "GET",
// 	onRequest: () => console.info("OnRequest"),
// 	params: [1320],
// });

// console.info(foo1, foo2, foo3, foo4);
