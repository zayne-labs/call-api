import {
	type CallApiParameters,
	createFetchClient,
	definePlugin,
	defineSchema,
	type PluginHooksWithMoreOptions,
	type PluginInitContext,
	type ResultModeUnion,
	type SuccessContext,
} from "@zayne-labs/callapi";
import { isValidationError } from "@zayne-labs/callapi/utils";
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

const pluginOne = definePlugin({
	defineExtraOptions: () => newOptionSchema1,

	hooks: {
		onRequest: () => console.info("OnRequest - PLUGIN1"),
	},

	id: "1",

	name: "plugin",
});

const pluginTwo = definePlugin({
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
					Authorization: request.headers["X-Environment"],
				},
			},
		};
	},

	name: "plugin",
});

const callMainApi = createFetchClient({
	baseURL: "https://dummyjson.com",
	onRequest: [() => console.info("OnRequest1 - BASE"), () => console.info("OnRequest2 - BASE")],
	onUpload: (_progress) => {},
	onUploadSuccess: (_progress) => {},
	plugins: [pluginOne, pluginTwo, loggerPlugin()],

	schema: defineSchema({
		"@delete/products/:id": {
			data: z.object({
				id: z.number(),
			}),
			headers: z
				.object({
					Authorization: z.string(),
				})
				.optional(),
		},

		"/products/:id": {
			data: z.object({
				id: z.number(),
				price: z.number(),
				title: z.string(),
			}),
		},
	}),
});

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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
	callMainApi<{ foo: string }>("/products/:id", {
		onRequest: () => console.info("OnRequest - INSTANCE"),
		params: [1],
	}),

	callMainApi("/products/:id", {
		params: [1],
	}),

	callMainApi("@delete/products/:id", {
		method: "DELETE",
		params: {
			id: "beans",
		},
	}),

	callMainApi("/products/:id", {
		method: "",
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

if (isValidationError(foo1.error)) {
	console.info(foo1.error);
}

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

const getAllowedDomains = async () => {
	await wait(1000);
	return ["example.com", "example.org"];
};

const callApi = createFetchClient({
	baseURL: "https://api.example.com",

	schema: defineSchema({
		"users/:id": {
			// Async body validator with custom validation
			body: async (body) => {
				if (!body || typeof body !== "object") {
					throw new Error("Invalid request body");
				}

				// Required fields
				if (!("name" in body) || typeof body.name !== "string") {
					throw new Error("Name is required");
				}

				if (!("email" in body) || typeof body.email !== "string" || !body.email.includes("@")) {
					throw new Error("Valid email required");
				}

				// Validate domain against allowed list
				const domain = body.email.split("@")[1] ?? "";
				const allowed = await getAllowedDomains();

				if (!allowed.includes(domain)) {
					throw new Error(`Email domain ${domain} not allowed`);
				}

				return {
					email: body.email.toLowerCase(),
					name: body.name.trim(),
				};
			},

			// Response data validator
			data: (data) => {
				if (
					!data
					|| typeof data !== "object"
					|| !("id" in data)
					|| !("name" in data)
					|| !("email" in data)
				) {
					throw new Error("Invalid response data");
				}

				return data; // Type will be narrowed to { id: number; name: string; email: string }
			},
		},
	}),
});

// @annotate: Types are inferred from validator return types
const { data: ignoredUserData } = await callApi("users/:id", {
	body: {
		email: "JOHN@example.com",
		name: " John ", // Will be trimmed & lowercased.
	},
});

export type ApiSuccessResponse<TData> = {
	data?: TData;
	message: string;
	status: "success";
	success: true;
};

export type ApiErrorResponse<TError = Record<string, string>> = {
	errors?: TError;
	message: string;
	status: "error";
	success: false;
};

const sharedFetchClient = createFetchClient({
	baseURL: "/api/v1",
	credentials: "same-origin",
	// plugins: [redirectOn401ErrorPlugin(), toastPlugin()],
});

export const callBackendApi = <
	TData = unknown,
	TErrorData = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	...parameters: CallApiParameters<ApiSuccessResponse<TData>, ApiErrorResponse<TErrorData>, TResultMode>
) => {
	const [url, config] = parameters;

	return sharedFetchClient(url, config);
};

export const callBackendApiOne = <
	TData = unknown,
	TError = unknown,
	TResultMode extends ResultModeUnion = ResultModeUnion,
>(
	...args: CallApiParameters<TData, TError, TResultMode>
) => {
	const [initUrl, config] = args;

	return sharedFetchClient(initUrl, config);
};

export const callBackendApiForQuery = <TData = unknown>(
	...parameters: CallApiParameters<ApiSuccessResponse<TData>, false | undefined>
) => {
	const [url, config] = parameters;

	return sharedFetchClient(url, {
		resultMode: "onlySuccessWithException",
		throwOnError: true,
		...config,
	});
};
