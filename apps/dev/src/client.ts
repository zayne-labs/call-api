import {
	type BaseCallApiSchema,
	type PluginHooksWithMoreOptions,
	type PluginInitContext,
	type SuccessContext,
	createFetchClient,
	definePlugin,
} from "@zayne-labs/callapi";
import { loggerPlugin } from "@zayne-labs/callapi-plugins";
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

type Plugin2Options = z.infer<typeof newOptionSchema2>;

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
	} satisfies PluginHooksWithMoreOptions<Plugin2Options>,

	id: "2",

	init: ({ options, request }: PluginInitContext<Plugin2Options>) => {
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
	config: {
		// baseURL: "http:localhost:3000",
		// requireMethodOption: true,
		// strict: true,
	},

	routes: {
		"@delete/products/:food": {
			data: z.object({
				foo: z.number(),
			}),
		},
		"/products/:id": {
			data: z.object({
				bar: z.string(),
			}),
		},
	},
} as const satisfies BaseCallApiSchema;

const callMainApi = createFetchClient({
	baseURL: "https://dummyjson.com",
	onRequest: [() => console.info("Base-OnRequest"), () => console.info("Base-OnRequest2")],
	onUpload: (_progress) => {},
	// onUploadSuccess: (_progress) => {},
	plugins: [plugin1, plugin2(), loggerPlugin()],
	schema: baseSchemas,
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

const [foo1, foo2, foo3, foo4, foo5] = await Promise.all([
	callMainApi<{ foo: string }, undefined>("/products/:id", {
		// onRequest: [() => console.info("Instance-OnRequest"), () => console.info("Instance-OnRequest2")],
		params: [1],
		resultMode: "onlySuccessWithException",
		throwOnError: true,
	}),

	callMainApi("@delete/products/:food", {
		method: "DELETE",
		params: ["beans"],
	}),
	callMainApi("/products/:id", {
		params: [1302],
		retryAttempts: 2,
		throwOnError: true,
	}),
	callMainApi("/products/:id", {
		body: ["dev"],
		method: "POST",
		params: [1],
	}),
	callMainApi("https://api.github.com/repos/zayne-labs/ui/commits?per_page=50", {
		baseURL: "",
		onRequestStream: (ctx) => console.info("OnRequestStream", { event: ctx.event }),
		onResponseStream: (ctx) => console.info("OnResponseStream", { event: ctx.event }),
	}),
]);

console.info(foo1, foo2, foo3, foo4, foo5);

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
