import { DateFormatter as IntlDateFormatter } from "@internationalized/date";

type QueryParams = Record<string, string | { toString(): string }>;

export type APICallResult<T extends object> = Response & {
	json: () => Promise<T>;
};

export async function apiCall<K extends object>(
	method: "GET",
	api: string,
	params?: QueryParams,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "POST" | "PATCH",
	api: string,
	params?: QueryParams,
	body?: object,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "DELETE",
	api: string,
	params?: QueryParams,
	body?: object,
): Promise<APICallResult<K>>;
export async function apiCall<K extends object>(
	method: "GET" | "POST" | "PATCH" | "DELETE",
	api: string,
	params?: QueryParams,
	body?: object,
): Promise<APICallResult<K>> {
	let url = window.origin + "/api/" + api;

	if (params) {
		const urlsearchparams = new URLSearchParams(
			Object.fromEntries(
				Object.entries(params).map(([key, value]): [string, string] => {
					if (typeof value !== "string") {
						return [key, value.toString()];
					} else {
						return [key, value];
					}
				}),
			),
		);

		url += "?" + urlsearchparams.toString();
	}

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json; charset=UTF-8",
		},
		credentials: "include",
		method,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	return response;
}

export function classNames(classNames: Record<string, boolean>): string {
	return Object.entries(classNames)
		.map(([classString, value]) => {
			if (value) {
				return classString;
			}
		})
		.join(" ");
}

export class DateFormatter {
	private formatter;

	constructor(locale: string, options?: Intl.DateTimeFormatOptions) {
		this.formatter = new IntlDateFormatter(locale, options);
	}

	format(dt: Date) {
		return this.formatter.format(dt);
	}
}

export function vaidatePassword(password: string): string[] {
	const errors = [];

	if (password.length < 1) {
		errors.push("Password must be 16 characters or more");
	}

	return errors;
}
