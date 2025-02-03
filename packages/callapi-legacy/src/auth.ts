/* eslint-disable perfectionist/sort-object-types -- Avoid Sorting for now */

import type { ExtraOptions } from "./types";
import { isFunction, isString } from "./utils/type-guards";

type ValueOrFunctionResult<TValue> = TValue | (() => TValue);

/**
 * Bearer Or Token authentication
 *
 * The value of `bearer` will be added to a header as
 * `auth: Bearer some-auth-token`,
 *
 * The value of `token` will be added to a header as
 * `auth: Token some-auth-token`,
 */
export type BearerOrTokenAuth =
	| {
			type?: "Bearer";
			bearer?: ValueOrFunctionResult<string | null>;
			token?: never;
	  }
	| {
			type?: "Token";
			bearer?: never;
			token?: ValueOrFunctionResult<string | null>;
	  };

/**
 * Basic auth
 */
export type BasicAuth = {
	type: "Basic";
	username: ValueOrFunctionResult<string | null | undefined>;
	password: ValueOrFunctionResult<string | null | undefined>;
};

/**
 * Custom auth
 *
 * @param prefix - prefix of the header
 * @param authValue - value of the header
 *
 * @example
 * ```ts
 * {
 *  type: "Custom",
 *  prefix: "Token",
 *  authValue: "token"
 * }
 * ```
 */
export type CustomAuth = {
	type: "Custom";
	prefix: ValueOrFunctionResult<string | null | undefined>;
	value: ValueOrFunctionResult<string | null | undefined>;
};

// eslint-disable-next-line perfectionist/sort-union-types -- Let the first one be first
export type Auth = BearerOrTokenAuth | BasicAuth | CustomAuth;

const getValue = (value: ValueOrFunctionResult<string | null | undefined>) => {
	return isFunction(value) ? value() : value;
};

type AuthorizationHeader = {
	Authorization: string;
};

export const getAuthHeader = (auth: ExtraOptions["auth"]): false | AuthorizationHeader | undefined => {
	if (auth === undefined) return;

	if (isString(auth) || auth === null) {
		return { Authorization: `Bearer ${auth}` };
	}

	switch (auth.type) {
		case "Basic": {
			const username = getValue(auth.username);
			const password = getValue(auth.password);

			if (username === undefined || password === undefined) return;

			return {
				Authorization: `Basic ${globalThis.btoa(`${username}:${password}`)}`,
			};
		}

		case "Custom": {
			const value = getValue(auth.value);

			if (value === undefined) return;

			const prefix = getValue(auth.prefix);

			return {
				Authorization: `${prefix} ${value}`,
			};
		}

		default: {
			const bearer = getValue(auth.bearer);
			const token = getValue(auth.token);

			if ("token" in auth && token !== undefined) {
				return { Authorization: `Token ${token}` };
			}

			return bearer !== undefined && { Authorization: `Bearer ${bearer}` };
		}
	}
};
