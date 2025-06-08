/* eslint-disable perfectionist/sort-object-types -- Avoid Sorting for now */

import type { SharedExtraOptions } from "./types/common";
import type { Awaitable } from "./types/type-helpers";
import { isFunction, isString } from "./utils/guards";

type ValueOrFunctionResult<TValue> = TValue | (() => TValue);

type ValidAuthValue = ValueOrFunctionResult<Awaitable<string | null | undefined>>;

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
			bearer?: ValidAuthValue;
			token?: never;
	  }
	| {
			type?: "Token";
			bearer?: never;
			token?: ValidAuthValue;
	  };

/**
 * Basic auth
 */
export type BasicAuth = {
	type: "Basic";
	username: ValidAuthValue;
	password: ValidAuthValue;
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
	prefix: ValidAuthValue;
	value: ValidAuthValue;
};

// eslint-disable-next-line perfectionist/sort-union-types -- Let the first one be first
export type Auth = BearerOrTokenAuth | BasicAuth | CustomAuth;

const getValue = (value: ValidAuthValue) => {
	return isFunction(value) ? value() : value;
};

type AuthorizationHeader = {
	Authorization: string;
};

export const getAuthHeader = async (
	auth: SharedExtraOptions["auth"]
): Promise<AuthorizationHeader | undefined> => {
	if (auth === undefined) return;

	if (isString(auth) || auth === null) {
		return { Authorization: `Bearer ${auth}` };
	}

	switch (auth.type) {
		case "Basic": {
			const username = await getValue(auth.username);
			const password = await getValue(auth.password);

			if (username === undefined || password === undefined) return;

			return {
				Authorization: `Basic ${globalThis.btoa(`${username}:${password}`)}`,
			};
		}

		case "Custom": {
			const value = await getValue(auth.value);

			if (value === undefined) return;

			const prefix = await getValue(auth.prefix);

			return {
				Authorization: `${prefix} ${value}`,
			};
		}

		default: {
			const bearer = await getValue(auth.bearer);
			const token = await getValue(auth.token);

			if ("token" in auth && token !== undefined) {
				return { Authorization: `Token ${token}` };
			}

			if (bearer === undefined) return;

			return { Authorization: `Bearer ${bearer}` };
		}
	}
};
