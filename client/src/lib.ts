import { DateFormatter as IntlDateFormatter } from "@internationalized/date";
import zustand, { User } from "./Zustand";
import { Availability } from "./app/admin/(availabilities)/AvailabilityEditor";

export type AllString<T> = { [K in keyof T]: string };

type QueryParams = Record<string, string | { toString(): string }>;

type Body = object | string | number | boolean;

export type APICallResult<T> = Omit<Response, "json"> & {
	json: () => Promise<T>;
};

export async function apiCall<K>(
	method: "GET",
	api: string,
	query?: QueryParams,
): Promise<APICallResult<K>>;
export async function apiCall<K>(
	method: "POST" | "PATCH" | "PUT",
	api: string,
	query?: QueryParams,
	body?: Body,
): Promise<APICallResult<K>>;
export async function apiCall<K>(
	method: "DELETE",
	api: string,
	query?: QueryParams,
	body?: Body,
): Promise<APICallResult<K>>;
export async function apiCall<K>(
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
	api: string,
	query?: QueryParams,
	body?: Body,
): Promise<APICallResult<K>> {
	let url = window.origin + "/api/" + api;

	if (query) {
		const urlsearchparams = new URLSearchParams(
			Object.fromEntries(
				Object.entries(query).map(([key, value]): [string, string] => {
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
			"Content-Type": `${getContentType(typeof body)}; charset=UTF-8`,
		},
		credentials: "include",
		method,
		body: prepareBody(body),
	});

	return response;
}

function getContentType(type: string): string {
	switch (type) {
		case "object":
			return "application/json";
		case "string":
		case "number":
		case "bigint":
		case "boolean":
			return "text/plain";
		default:
			return "application/octet-stream";
	}
}

function prepareBody(
	body: object | number | string | boolean | undefined,
): BodyInit | undefined {
	switch (typeof body) {
		case "object":
			return JSON.stringify(body);
		case "undefined":
			return undefined;
		default:
			return body.toString();
	}
}

export function classNames(...classNames: (string | undefined)[]): string;
export function classNames(classNames: string[]): string;
export function classNames(classNames: Record<string, boolean>): string;
export function classNames(
	classNames: string[] | Record<string, boolean> | string | undefined,
	...rest: (string | undefined)[]
) {
	// if rest isn't undefined, use the rest values
	if (rest !== undefined) {
		return [classNames, ...rest].join(" ");

		// if classnames is undefined too, return an empty string
	} else if (classNames === undefined) {
		return "";

		// if classnames is an array, join it
	} else if (Array.isArray(classNames)) {
		return classNames.join(" ");

		// if classnames is an object, join it based on the value
	} else {
		return Object.entries(classNames)
			.filter(([, value]) => value)
			.map(([classString]) => classString)
			.join(" ");
	}
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

export function validatePassword(password: string): string[] {
	const errors = [];

	if (password.length < 12) {
		errors.push("Password must be 12 characters or more");
	} else if (password.length > 64) {
		errors.push("Password must be 64 characters or short");
	}

	return errors;
}

export type TaskID = number;

export interface Task {
	taskID: TaskID | undefined;
	taskName: string;
	enabled: boolean;
}

export async function getTask(name: string): Promise<Task | undefined> {
	// get the tasks
	const tasks = await getTasks();

	return tasks.find((t) => t.taskName === name);
}

export async function getTasks(): Promise<Task[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.tasks) {
		return state.tasks;
	} else {
		const result = await apiCall<Task[]>("GET", "tasks");

		if (result.ok) {
			const tasks = (await result.json()) as Task[];

			state.patch({ tasks: tasks });

			return tasks;
		} else {
			return [];
		}
	}
}

export async function getAvailabilities(): Promise<Availability[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.availabilities) {
		return state.availabilities;
	} else {
		const result = await apiCall<Availability[]>("GET", "availabilities");

		if (result.ok) {
			const availabilities = await result.json();

			state.patch({ availabilities });

			console.debug(zustand.getState().availabilities);

			return availabilities;
		} else {
			return [];
		}
	}
}

export async function getUsers(): Promise<User[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.users) {
		return state.users;
	} else {
		const result = await apiCall<User[]>("GET", "users");

		if (result.ok) {
			const users = await result.json();

			state.patch({ users });

			return users;
		} else {
			return [];
		}
	}
}

export async function getUserTasks(): Promise<TaskID[]> {
	// check wether it is cached in zustand
	const state = zustand.getState();

	if (!!state.userTasks) {
		return state.userTasks;
	} else {
		const result = await apiCall<TaskID[]>("GET", "user/tasks");

		if (result.ok) {
			const userTasks = await result.json();

			state.patch({ userTasks });

			return userTasks;
		} else {
			return [];
		}
	}
}
