import {
	type PluginHooksWithMoreOptions,
	type PluginInitContext,
	type SuccessContext,
	createFetchClient,
	definePlugin,
	defineSchema,
} from "@zayne-labs/callapi";
import { loggerPlugin } from "@zayne-labs/callapi-plugins";
import z from "zod";

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
	defineExtraOptions: () => newOptionSchema1,

	hooks: {
		onRequest: () => console.info("OnRequest - PLUGIN1"),
	},

	id: "1",

	name: "plugin",
});

const plugin2 = definePlugin(() => ({
	defineExtraOptions: () => newOptionSchema2,

	hooks: {
		onRequest: () => console.info("OnRequest - PLUGIN2"),
		onSuccess: (_ctx: SuccessContext<{ foo: string }>) => console.info("OnSuccess - PLUGIN2"),
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

const baseSchemas = defineSchema({
	"@delete/products/:food": {
		data: z.object({
			id: z.number(),
		}),
	},
	"/products/:id": {
		data: z.object({
			id: z.number(),
			price: z.number(),
			title: z.string(),
		}),
	},
});

const callMainApi = createFetchClient({
	baseURL: "https://dummyjson.com",
	onRequest: [() => console.info("OnRequest1 - BASE"), () => console.info("OnRequest2 - BASE")],
	onUpload: (_progress) => {},
	onUploadSuccess: (_progress) => {},
	plugins: [plugin1, plugin2(), loggerPlugin()],
	schema: baseSchemas,
	schemaConfig: {
		baseURL: "loclc",
	},
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

const [foo1, foo2, foo3, foo4, foo5, foo6] = await Promise.all([
	callMainApi("/products/:id", {
		onRequest: () => console.info("OnRequest - INSTANCE"),
		params: [1],
	}),

	callMainApi("/products/:id", {
		params: [1],
	}),

	callMainApi("@delete/products/:food", {
		params: { food: "beans" },
		// method: "FOO",
	}),

	callMainApi("/products/:id", {
		params: [1302],
	}),

	callMainApi("/products/:id", {
		body: ["dev"],
		method: "POST",
		params: [1],
	}),

	callMainApi("https://api.github.com/repos/zayne-labs/ui/commits?per_page=50", {
		onRequestStream: (ctx) => console.info("OnRequestStream", { event: ctx.event }),
		onResponseStream: (ctx) => console.info("OnResponseStream", { event: ctx.event }),
	}),
]);

console.info(foo1, foo2, foo3, foo4, foo5, foo6);

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
