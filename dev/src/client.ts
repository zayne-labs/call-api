import { callApi } from "@zayne-labs/callapi";

const [foo1, foo2, foo3, foo4] = await Promise.all([
	callApi("https://dummyjson.com/products/:id", {
		dedupeStrategy: "defer",
		method: "GET",
		params: [1],
	}),

	callApi("https://dummyjson.com/products/:id", {
		dedupeStrategy: "defer",
		method: "GET",
	}),
	callApi("https://dummyjson.com/products/:id", {
		dedupeStrategy: "defer",
		method: "GET",
	}),
	callApi("https://dummyjson.com/products/:id", {
		dedupeStrategy: "defer",
		method: "GET",
		params: [1],
	}),
]);

console.log(foo1, foo2, foo3, foo4);
