import { createFetchClient, defineCallApiPlugin } from "@zayne-labs/callapi";
// import { createFetchClient } from "./src";

const plugin = defineCallApiPlugin({
	hooks: {
		onRequest: () => console.info("PLUGIN"),
	},
	id: "1",
	name: "sdew",
});

const callApi = createFetchClient({
	dedupeStrategy: "cancel",
	plugins: [plugin],
});

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
		params: [1],
	}),
]);

console.info(foo1, foo2, foo3, foo4);
