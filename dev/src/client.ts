import { createFetchClient, defineCallApiPlugin } from "@zayne-labs/callapi";
// import { createFetchClient, defineCallApiPlugin } from "./src";

const plugin = defineCallApiPlugin({
	hooks: {
		onRequest: () => console.info("PLUGIN-OnRequest"),
	},
	id: "1",
	name: "sdew",
});

const callApi = createFetchClient({
	dedupeStrategy: "none",
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
		params: [1],
	}),
]);

console.info(foo1, foo2, foo3, foo4);
