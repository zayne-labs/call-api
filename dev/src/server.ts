import { callApi } from "@zayne-labs/callapi";

const foo = await callApi("https://jsonplaceholder.typicode.com/todos/:id", {
	method: "POST",
	body: new FormData(),
	params: { id: 3 },
	onRequest: ({ request, options }) => {
		console.log(request);
	},
});

console.log(foo.response);
