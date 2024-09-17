import { callApi } from "@zayne-labs/callapi";

const fetchStuff = () =>
	callApi("https://jsonplaceholder.typicode.com/todos/:id", {
		method: "POST",
		body: new FormData(),
		params: [1],
	});

void fetchStuff();
